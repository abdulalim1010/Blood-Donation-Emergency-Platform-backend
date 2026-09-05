import type { Request, Response } from "express";
import { PatientService } from "./patient.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const createPatientProfile = async (
  req: Request,
  res: Response,
) => {
  try {
      const userId = req.user!.userId;

    const result = await PatientService.createPatientProfile(
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Patient profile created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPatientProfile = async (
  req: Request,
  res: Response,
) => {
  try {
       const userId = req.user!.userId;

    const result = await PatientService.getMyPatientProfile(userId);

    res.status(200).json({
      success: true,
      message: "Patient profile retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMyPatientProfile = async (
  req: Request,
  res: Response,
) => {
  try {
       const userId = req.user!.userId;

    const result = await PatientService.updateMyPatientProfile(
      userId,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMyPatientProfile = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;

    await PatientService.deleteMyPatientProfile(userId);

    res.status(200).json({
      success: true,
      message: "Patient profile deleted successfully",
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
const getAllPatients = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100,
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const result = await PatientService.getAllPatients(
      page,
      limit,
      search,
    );

    res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const PatientController = {
  createPatientProfile,
  getMyPatientProfile,
  updateMyPatientProfile,
  deleteMyPatientProfile,
  getAllPatients, 
};