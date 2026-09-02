import type { Request, Response } from "express";
import { UserService } from "./user.service.js";

const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserService.createUser(req.body);

    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsers();

    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: usersWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

const getSingleUser = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const user = await UserService.getSingleUser(req.params.id);

    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "User not found",
    });
  }
};

export const UserController = {
  createUser,
  getAllUsers,
  getSingleUser,
};