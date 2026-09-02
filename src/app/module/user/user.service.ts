import prisma from "../../lib/prisma.js";


const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "DONOR" | "PATIENT";
}) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role ?? "PATIENT",
    },
  });

  return user;
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const UserService = {
  createUser,
  getAllUsers,
  getSingleUser,
};

