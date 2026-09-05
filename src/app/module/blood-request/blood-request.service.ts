

import prisma from "../../lib/prisma.js";
import type {
  ICreateBloodRequest,
  IUpdateBloodRequest,
} from "./blood-request.interface.js";


// Create Blood Request
const createBloodRequest = async (
  userId: string,
  payload: ICreateBloodRequest,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error(
      "Patient profile not found. Please create your patient profile first.",
    );
  }

const bloodRequest = await prisma.bloodRequest.create({
  data: {
    patientId: patient.id,
    bloodGroup: payload.bloodGroup,
    unitsNeeded: payload.unitsNeeded,
    hospitalName: payload.hospitalName,
    location: payload.location,
    contactNumber: payload.contactNumber,
    neededAt: new Date(payload.neededAt),

    ...(payload.urgency !== undefined && {
      urgency: payload.urgency,
    }),

    ...(payload.description !== undefined && {
      description: payload.description,
    }),
  },
});

  return bloodRequest;
};


// Get My Blood Requests with Pagination
const getMyBloodRequests = async (
  userId: string,
  page: number,
  limit: number,
  status?: string,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const skip = (page - 1) * limit;

  const where: any = {
    patientId: patient.id,
    isDeleted: false,
  };

  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.bloodRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.bloodRequest.count({
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

    data: requests,
  };
};


// Get Single Blood Request
const getBloodRequestById = async (
  userId: string,
  requestId: string,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const request = await prisma.bloodRequest.findFirst({
    where: {
      id: requestId,
      patientId: patient.id,
      isDeleted: false,
    },
  });

  if (!request) {
    throw new Error("Blood request not found");
  }

  return request;
};


// Update Blood Request
const updateBloodRequest = async (
  userId: string,
  requestId: string,
  payload: IUpdateBloodRequest,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const existingRequest = await prisma.bloodRequest.findFirst({
    where: {
      id: requestId,
      patientId: patient.id,
      isDeleted: false,
    },
  });

  if (!existingRequest) {
    throw new Error("Blood request not found");
  }

 const updatedRequest = await prisma.bloodRequest.update({
  where: {
    id: requestId,
  },

  data: {
    ...(payload.bloodGroup !== undefined && {
      bloodGroup: payload.bloodGroup,
    }),

    ...(payload.unitsNeeded !== undefined && {
      unitsNeeded: payload.unitsNeeded,
    }),

    ...(payload.hospitalName !== undefined && {
      hospitalName: payload.hospitalName,
    }),

    ...(payload.location !== undefined && {
      location: payload.location,
    }),

    ...(payload.contactNumber !== undefined && {
      contactNumber: payload.contactNumber,
    }),

    ...(payload.urgency !== undefined && {
      urgency: payload.urgency,
    }),

    ...(payload.neededAt !== undefined && {
      neededAt: new Date(payload.neededAt),
    }),

    ...(payload.description !== undefined && {
      description: payload.description,
    }),
  },
});
  return updatedRequest;
};


// Delete Blood Request - Soft Delete
const deleteBloodRequest = async (
  userId: string,
  requestId: string,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const existingRequest = await prisma.bloodRequest.findFirst({
    where: {
      id: requestId,
      patientId: patient.id,
      isDeleted: false,
    },
  });

  if (!existingRequest) {
    throw new Error("Blood request not found");
  }

  await prisma.bloodRequest.update({
    where: {
      id: requestId,
    },

    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return null;
};


// Search My Blood Requests
const searchBloodRequests = async (
  userId: string,
  keyword: string,
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const requests = await prisma.bloodRequest.findMany({
    where: {
      patientId: patient.id,
      isDeleted: false,

      OR: [
        {
          hospitalName: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          location: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          description: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      ],
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
};


export const BloodRequestService = {
  createBloodRequest,
  getMyBloodRequests,
  getBloodRequestById,
  updateBloodRequest,
  deleteBloodRequest,
  searchBloodRequests,
};