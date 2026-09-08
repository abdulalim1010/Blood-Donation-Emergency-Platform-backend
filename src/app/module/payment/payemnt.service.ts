import prisma from "../../lib/prisma.js";
import {
  createBkashPayment,
  executeBkashPayment,
} from "../../lib/bkash.js";
import type { CreatePaymentPayload } from "./payment.interface.js";

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
    throw new Error("User not found");
  }

  const merchantInvoiceNumber =
    `DONATION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const paymentData = {
  userId,
  amount: payload.amount,
  paymentMethod: "BKASH" as const,
  status: "PENDING" as const,

  donorName: user.name,
  donorEmail: user.email,

  isAnonymous: payload.isAnonymous ?? false,

  merchantInvoiceNumber,
};

if (payload.message !== undefined) {
  Object.assign(paymentData, {
    donorMessage: payload.message,
  });
}

const payment = await prisma.payment.create({
  data: paymentData,
});

  try {
    const bkashPayment = await createBkashPayment(
      payload.amount,
      merchantInvoiceNumber,
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

const executePayment = async (
  paymentID: string,
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      paymentId: paymentID,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const result = await executeBkashPayment(paymentID);

  if (result.transactionStatus === "Completed") {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "COMPLETED",
        transactionId: result.trxID,
      },
    });

    return updatedPayment;
  }

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: "FAILED",
    },
  });

  throw new Error("bKash payment was not completed");
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

const getPaymentById = async (
  userId: string,
  paymentId: string,
) => {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
  });
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

export const PaymentService = {
  createPayment,
  executePayment,
  getMyPayments,
  getPaymentById,
  getPublicDonations,
};