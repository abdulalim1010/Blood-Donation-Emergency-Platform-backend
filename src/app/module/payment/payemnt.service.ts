import httpStatus from "http-status";
import prisma from "../../lib/prisma.js";
import {
  createBkashPayment,
  executeBkashPayment,
} from "../../lib/bkash.js";
import type { CreatePaymentPayload } from "./payment.interface.js";
import { AppError } from "../../utils/AppError.js";

const isCompletedStatus = (transactionStatus?: string) =>
  transactionStatus?.trim().toLowerCase() === "completed";

const createPayment = async (
  userId: string,
  payload: CreatePaymentPayload,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const merchantInvoiceNumber = `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const payment = await prisma.payment.create({
    data: {
      userId,
      amount: payload.amount,
      paymentMethod: "BKASH",
      status: "PENDING",
      donorName: user.name,
      donorEmail: user.email,
      isAnonymous: payload.isAnonymous ?? false,
      merchantInvoiceNumber,
      ...(payload.message !== undefined
        ? { donorMessage: payload.message }
        : {}),
    },
  });

  try {
    const bkashPayment = await createBkashPayment(
      payload.amount,
      merchantInvoiceNumber,
      user.id.replace(/-/g, "").slice(0, 20),
    );

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        paymentId: bkashPayment.paymentID,
      },
    });

    return {
      payment: updatedPayment,
      bkashURL: bkashPayment.bkashURL,
      paymentID: bkashPayment.paymentID,
    };
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
};

const executePayment = async (paymentID: string) => {
  if (!paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is required");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      paymentId: paymentID,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (payment.status === "COMPLETED") {
    return payment;
  }

  const result = await executeBkashPayment(paymentID);

  if (isCompletedStatus(result.transactionStatus) && result.trxID) {
    return prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "COMPLETED",
        transactionId: result.trxID,
      },
    });
  }

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: "FAILED",
    },
  });

  throw new AppError(
    httpStatus.BAD_REQUEST,
    result.statusMessage || "bKash payment was not completed",
  );
};

const getMyPayments = async (userId: string) => {
  return prisma.payment.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getPaymentById = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  return payment;
};

const getPublicDonations = async () => {
  return prisma.payment.findMany({
    where: {
      status: "COMPLETED",
    },
    select: {
      id: true,
      donorName: true,
      amount: true,
      donorMessage: true,
      isAnonymous: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
};

const handleBkashCallback = async (paymentID: string, status: string) => {
  if (!paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is required");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      paymentId: paymentID,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus === "cancel" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled"
  ) {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      type: "CANCELLED" as const,
      message: "Payment was cancelled by the user.",
      payment: updatedPayment,
    };
  }

  if (
    normalizedStatus === "failure" ||
    normalizedStatus === "fail" ||
    normalizedStatus === "failed"
  ) {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

    return {
      type: "FAILED" as const,
      message: "bKash payment failed. The wallet was declined or has insufficient balance.",
      payment: updatedPayment,
    };
  }

  if (normalizedStatus === "success") {
    if (payment.status === "COMPLETED") {
      return {
        type: "SUCCESS" as const,
        message: "Payment completed successfully.",
        payment,
      };
    }

    const result = await executeBkashPayment(paymentID);

    if (!isCompletedStatus(result.transactionStatus) || !result.trxID) {
      const updatedPayment = await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "FAILED",
        },
      });

      return {
        type: "FAILED" as const,
        message:
          result.statusMessage || "bKash payment could not be completed.",
        payment: updatedPayment,
      };
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "COMPLETED",
        transactionId: result.trxID,
      },
    });

    return {
      type: "SUCCESS" as const,
      message: "Payment completed successfully.",
      payment: updatedPayment,
    };
  }

  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Unknown bKash callback status: ${status}`,
  );
};

export const PaymentService = {
  createPayment,
  executePayment,
  getMyPayments,
  getPaymentById,
  getPublicDonations,
  handleBkashCallback,
};
