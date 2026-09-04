
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

export const PatientService = {
  createPatientProfile,
  getMyPatientProfile,
  updateMyPatientProfile,
  deleteMyPatientProfile,
};