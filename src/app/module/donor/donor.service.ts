import prisma from "../../lib/prisma.js";
import type { IDonorProfile, IUpdateDonorProfile } from "./donor.interface.js";



// Create Donor Profile
const createDonorProfile = async (
  userId: string,
  payload: IDonorProfile,
) => {
  const existingDonor = await prisma.donor.findUnique({
    where: {
      userId,
    },
  });

  if (existingDonor) {
    throw new Error("Donor profile already exists");
  }

  const donor = await prisma.donor.create({
    data: {
      userId,
      name: payload.name,
      email: payload.email,
      phoneNo: payload.phoneNo,
      address: payload.address,
      bloodGroup: payload.bloodGroup,

      ...(payload.lastDonationDate !== undefined && {
        lastDonationDate: new Date(
          payload.lastDonationDate,
        ),
      }),

      ...(payload.nextDonationDate !== undefined && {
        nextDonationDate: new Date(
          payload.nextDonationDate,
        ),
      }),

      ...(payload.isAvailable !== undefined && {
        isAvailable: payload.isAvailable,
      }),
    },
  });

  return donor;
};


// Get My Donor Profile
const getMyDonorProfile = async (
  userId: string,
) => {
  const donor = await prisma.donor.findUnique({
    where: {
      userId,
    },
  });

  if (!donor) {
    throw new Error("Donor profile not found");
  }

  return donor;
};


// Update My Donor Profile
const updateMyDonorProfile = async (
  userId: string,
  payload: IUpdateDonorProfile,
) => {
  const donor = await prisma.donor.findUnique({
    where: {
      userId,
    },
  });

  if (!donor) {
    throw new Error("Donor profile not found");
  }

  const updatedDonor = await prisma.donor.update({
    where: {
      userId,
    },

    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),

      ...(payload.email !== undefined && {
        email: payload.email,
      }),

      ...(payload.phoneNo !== undefined && {
        phoneNo: payload.phoneNo,
      }),

      ...(payload.address !== undefined && {
        address: payload.address,
      }),

      ...(payload.bloodGroup !== undefined && {
        bloodGroup: payload.bloodGroup,
      }),

      ...(payload.lastDonationDate !== undefined && {
        lastDonationDate: new Date(
          payload.lastDonationDate,
        ),
      }),

      ...(payload.nextDonationDate !== undefined && {
        nextDonationDate: new Date(
          payload.nextDonationDate,
        ),
      }),

      ...(payload.isAvailable !== undefined && {
        isAvailable: payload.isAvailable,
      }),
    },
  });

  return updatedDonor;
};


// Delete My Donor Profile
const deleteMyDonorProfile = async (
  userId: string,
) => {
  const donor = await prisma.donor.findUnique({
    where: {
      userId,
    },
  });

  if (!donor) {
    throw new Error("Donor profile not found");
  }

  await prisma.donor.delete({
    where: {
      userId,
    },
  });

  return null;
};


// Get All Donors
const getAllDonors = async (
  page: number,
  limit: number,
  search?: string,
  bloodGroup?: string,
  isAvailable?: boolean,
) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phoneNo: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        address: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (bloodGroup) {
    where.bloodGroup = bloodGroup;
  }

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable;
  }

  const [donors, total] = await Promise.all([
    prisma.donor.findMany({
      where,
      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.donor.count({
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

    data: donors,
  };
};


// Search Donors
const searchDonors = async (
  keyword: string,
) => {
  const donors = await prisma.donor.findMany({
    where: {
      isAvailable: true,

      OR: [
        {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          email: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          phoneNo: {
            contains: keyword,
            mode: "insensitive",
          },
        },

        {
          address: {
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

  return donors;
};


export const DonorService = {
  createDonorProfile,
  getMyDonorProfile,
  updateMyDonorProfile,
  deleteMyDonorProfile,
  getAllDonors,
  searchDonors,
};