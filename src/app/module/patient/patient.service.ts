
import prisma from "../../lib/prisma.js";

import type { IPatientProfile } from "./patient.interface.js";

const createPatientProfile = async (
  userId: string,
  payload: IPatientProfile,
) => {
  const existingPatient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (existingPatient) {
    throw new Error("Patient profile already exists");
  }

  const patient = await prisma.patient.create({
    data: {
      userId,
      name: payload.name,
      email: payload.email,
      phoneNo: payload.phoneNo,
      address: payload.address,
      bloodGroup: payload.bloodGroup,
    },
  });

  return patient;
};

const getMyPatientProfile = async (userId: string) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  return patient;
};

const updateMyPatientProfile = async (
  userId: string,
  payload: Partial<IPatientProfile>,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const updatedPatient = await prisma.patient.update({
    where: {
      userId,
    },
    data: payload,
  });

  return updatedPatient;
};

const deleteMyPatientProfile = async (userId: string) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  await prisma.patient.delete({
    where: {
      userId,
    },
  });

  return null;
};
const getAllPatients = async (
  page: number,
  limit: number,
  search?: string,
) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phoneNo: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            address: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.patient.count({
      where,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: patients,
  };
};

export const PatientService = {
  createPatientProfile,
  getMyPatientProfile,
  updateMyPatientProfile,
  deleteMyPatientProfile,
  getAllPatients,
};