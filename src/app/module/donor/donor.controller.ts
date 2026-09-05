import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync.js";

import { DonorService } from "./donor.service.js";


// Create Donor Profile
const createDonorProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result =
      await DonorService.createDonorProfile(
        userId,
        req.body,
      );

    res.status(201).json({
      success: true,
      message: "Donor profile created successfully",
      data: result,
    });
  },
);


// Get My Donor Profile
const getMyDonorProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result =
      await DonorService.getMyDonorProfile(
        userId,
      );

    res.status(200).json({
      success: true,
      message: "Donor profile retrieved successfully",
      data: result,
    });
  },
);


// Update My Donor Profile
const updateMyDonorProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result =
      await DonorService.updateMyDonorProfile(
        userId,
        req.body,
      );

    res.status(200).json({
      success: true,
      message: "Donor profile updated successfully",
      data: result,
    });
  },
);


// Delete My Donor Profile
const deleteMyDonorProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await DonorService.deleteMyDonorProfile(
      userId,
    );

    res.status(200).json({
      success: true,
      message: "Donor profile deleted successfully",
      data: null,
    });
  },
);


// Get All Donors
const getAllDonors = catchAsync(
  async (req: Request, res: Response) => {
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

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const bloodGroup =
      typeof req.query.bloodGroup === "string"
        ? req.query.bloodGroup
        : undefined;

    let isAvailable: boolean | undefined;

    if (req.query.isAvailable === "true") {
      isAvailable = true;
    }

    if (req.query.isAvailable === "false") {
      isAvailable = false;
    }

    const result =
      await DonorService.getAllDonors(
        page,
        limit,
        search,
        bloodGroup,
        isAvailable,
      );

    res.status(200).json({
      success: true,
      message: "Donors retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);


// Search Donors
const searchDonors = catchAsync(
  async (req: Request, res: Response) => {
    const keyword =
      typeof req.query.q === "string"
        ? req.query.q
        : "";

    const result =
      await DonorService.searchDonors(
        keyword,
      );

    res.status(200).json({
      success: true,
      message: "Donors searched successfully",
      data: result,
    });
  },
);


export const DonorController = {
  createDonorProfile,
  getMyDonorProfile,
  updateMyDonorProfile,
  deleteMyDonorProfile,
  getAllDonors,
  searchDonors,
};