import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { BloodRequestService } from "./blood-request.service.js";



// Create Blood Request
const createBloodRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result =
      await BloodRequestService.createBloodRequest(
        userId,
        req.body,
      );

    res.status(201).json({
      success: true,
      message: "Blood request created successfully",
      data: result,
    });
  },
);


// Get My Blood Requests
const getMyBloodRequests = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 10,
        1,
      ),
      100,
    );

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const result =
      await BloodRequestService.getMyBloodRequests(
        userId,
        page,
        limit,
        status,
      );

    res.status(200).json({
      success: true,
      message: "Blood requests retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);


// Get Single Blood Request
const getBloodRequestById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result =
      await BloodRequestService.getBloodRequestById(
        userId,
        req.params.id as string 
      );

    res.status(200).json({
      success: true,
      message: "Blood request retrieved successfully",
      data: result,
    });
  },
);


// Update Blood Request
const updateBloodRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result =
      await BloodRequestService.updateBloodRequest(
        userId,
        req.params.id as string,
        req.body,
      );

    res.status(200).json({
      success: true,
      message: "Blood request updated successfully",
      data: result,
    });
  },
);


// Delete Blood Request
const deleteBloodRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await BloodRequestService.deleteBloodRequest(
      userId,
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      message: "Blood request deleted successfully",
      data: null,
    });
  },
);


// Search Blood Requests
const searchBloodRequests = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const keyword =
      typeof req.query.q === "string"
        ? req.query.q
        : "";

    const result =
      await BloodRequestService.searchBloodRequests(
        userId,
        keyword,
      );

    res.status(200).json({
      success: true,
      message: "Blood requests searched successfully",
      data: result,
    });
  },
);


export const BloodRequestController = {
  createBloodRequest,
  getMyBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  deleteBloodRequest,
  searchBloodRequests,
};