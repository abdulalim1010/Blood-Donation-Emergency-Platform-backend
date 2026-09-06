import type { Request, Response } from "express";
import httpStatus from "http-status";

import { AuthService } from "./auth.service.js";
import type { IRequestUser } from "./auth.interface.js";
import { catchAsync } from "../../utils/catchAsync.js";

import { AppError } from "../../utils/AppError.js";
import { sendResponse } from "../../utils/sendResponse.js";
import prisma from "../../lib/prisma.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/uploadToCloudinary.js";
;

const registerUser = catchAsync(async (req: Request, res: Response) => {
	// const payload = PatientValidation.PatientRegistrationZodSchema.safeParse(req.body);

	// if(!payload.success){
	// 	console.log(payload.error);
	// 	console.log(payload.error.issues);

	// 	throw new Error(payload.error.issues[0].message)
	// }

	// console.log(payload);

	const payload = req.body;

	await AuthService.registerUser(payload);

	// const { accessToken, refreshToken, user, patient } = result;

	// res.cookie("accessToken", accessToken, {
	// 	httpOnly: true,
	// 	secure: false,
	// 	sameSite: "none",
	// 	maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	// });
	// res.cookie("refreshToken", refreshToken, {
	// 	httpOnly: true,
	// 	secure: false,
	// 	sameSite: "none",
	// 	maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	// });

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Verification OTP Sent",
		data: null,
	});
});
const verifyEmail= catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.verifyEmail(payload);

	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Email Verified Successfully",
		data: {
			accessToken,
			refreshToken,
			user,
			
		},
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await AuthService.loginUser(payload);
	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged in successfully",
		data: {
			accessToken,
			refreshToken,
		},
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as unknown as IRequestUser;

	if (!user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User information is missing in the request");
	}

	const result = await AuthService.getMe(user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
	}
	const result = await AuthService.refreshToken(req.cookies.refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});
const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.googleLogin(payload);

	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken,
		},
	});
});
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await AuthService.forgotPassword(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `OTP Sent To Email : ${payload.email}`,
		data: null,
	});
});
const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await AuthService.resetPassword(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Password Changed Successfully",
		data: null,
	});
});



const uploadProfileImage = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    if (!req.file) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Please upload an image",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "User not found",
      );
    }

    // Upload new image first
    const result = await uploadToCloudinary(
      req.file.buffer,
      "blood-donation/profile-images",
    );

    try {
      // Update database
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          imageUrl: result.secure_url,
          imagePublicId: result.public_id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          imagePublicId: true,
        },
      });

      // Delete old image after successful DB update
      if (user.imagePublicId) {
        await deleteFromCloudinary(user.imagePublicId);
      }

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      // If database update fails, remove newly uploaded image
      await deleteFromCloudinary(result.public_id);

      throw error;
    }
  },
);
export const AuthController = {
	registerUser,
	verifyEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	uploadProfileImage,
	
};
