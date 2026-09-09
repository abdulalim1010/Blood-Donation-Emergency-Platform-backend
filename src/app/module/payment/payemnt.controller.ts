import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { PaymentService } from "./payemnt.service.js";
import config from "../../config/index.js";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await PaymentService.createPayment(userId, req.body);

  res.status(201).json({
    success: true,
    message: "Payment created successfully",
    data: result,
  });
});

const executePayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentID } = req.body;

  if (!paymentID || typeof paymentID !== "string") {
    throw new AppError(httpStatus.BAD_REQUEST, "paymentID is required");
  }

  const result = await PaymentService.executePayment(paymentID);

  res.status(200).json({
    success: true,
    message: "Payment completed successfully",
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await PaymentService.getMyPayments(userId);

  res.status(200).json({
    success: true,
    message: "Payment history retrieved successfully",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment ID");
  }

  const result = await PaymentService.getPaymentById(userId, id);

  res.status(200).json({
    success: true,
    message: "Payment retrieved successfully",
    data: result,
  });
});

const getPublicDonations = catchAsync(async (_req: Request, res: Response) => {
  const result = await PaymentService.getPublicDonations();

  const donations = result.map((donation) => ({
    ...donation,
    donorName: donation.isAnonymous ? "Anonymous Donor" : donation.donorName,
  }));

  res.status(200).json({
    success: true,
    message: "Recent donations retrieved successfully",
    data: donations,
  });
});

const bkashCallback = catchAsync(async (req: Request, res: Response) => {
  const { paymentID, status } = req.query;

  if (typeof paymentID !== "string" || typeof status !== "string") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid bKash callback data",
    );
  }

  const result = await PaymentService.handleBkashCallback(paymentID, status);

  if (config.frontend_url) {
    const redirectUrl = new URL("/payment/callback", config.frontend_url);
    redirectUrl.searchParams.set("status", result.type.toLowerCase());
    redirectUrl.searchParams.set("paymentID", paymentID);
    redirectUrl.searchParams.set("message", result.message);
    res.redirect(redirectUrl.toString());
    return;
  }

  res.status(200).json({
    success: result.type === "SUCCESS",
    message: result.message,
    data: result,
  });
});

export const PaymentController = {
  createPayment,
  executePayment,
  getMyPayments,
  getPaymentById,
  getPublicDonations,
  bkashCallback,
};
