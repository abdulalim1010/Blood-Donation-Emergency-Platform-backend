/** biome-ignore-all lint/style/useConst: <explanation> */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";

import config from "../../config/index.js";
import { googleClient } from "../../lib/googleAuth.js";
import prisma from "../../lib/prisma.js";

import { transporter } from "../../lib/nodemailer.js";
import { AppError } from "../../utils/AppError.js";

import { AuthProvider, Role, UserStatus } from "../../../generated/prisma/enums.js";
import { redisClient } from "../../lib/redis.js";

import { jwtUtils } from "../../utils/jwt.js";
import type {
	IBecomeDonorPayload,
	IBecomePatientPayload,
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterUserPayload,
	IRequestUser,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface.js";

const generateAuthTokens = (user: { id: string; name: string; email: string; role: string }) => {
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return { accessToken, refreshToken };
};

const sendTemplateEmail = async (
	templateFile: string,
	to: string,
	subject: string,
	templateData: Record<string, unknown>,
) => {
	const templatePath = path.join(process.cwd(), "src/app/templates", templateFile);
	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to,
		subject,
		html,
	});
};

// ---------------------------------------------------------------------------
// Registration — collects ONLY base user info. No donor/patient data here.
// ---------------------------------------------------------------------------
const registerUser = async (payload: IRegisterUserPayload) => {
	const { name, password } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({ where: { email } });

	if (isUserExists) {
		throw new AppError(httpStatus.CONFLICT, "User with this email already exists");
	}

	const hashedPassword = await bcrypt.hash(password, 8);
	const expirationSeconds = 5 * 60;

	const otpKey = `registration-otp:${email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(otpKey, otpValue, {
		expiration: { type: "EX", value: expirationSeconds },
	});

	const registrationKey = `registration-data:${email}`;
	const redisUserDataPayload = { name, email, password: hashedPassword };

	await redisClient.set(registrationKey, JSON.stringify(redisUserDataPayload), {
		expiration: { type: "EX", value: expirationSeconds },
	});

	await sendTemplateEmail("registration-user-otp.ejs", email, "Email Verification", {
		name,
		email,
		otp: otpValue,
		expirationMinutes: expirationSeconds / 60,
	});
};

// ---------------------------------------------------------------------------
// Verify email — creates the base User only. role = USER (undecided).
// No Patient/Donor record is created here.
// ---------------------------------------------------------------------------
const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({ where: { email } });

	if (isUserExist?.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}
	if (isUserExist?.emailVerified) {
		throw new AppError(httpStatus.CONFLICT, "Email Already Verified");
	}
	if (isUserExist?.isDeleted || isUserExist?.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
	}

	const otpKey = `registration-otp:${email}`;
	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
	}
	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
	}

	await redisClient.del(otpKey);

	const registrationKey = `registration-data:${email}`;
	const redisUserData = await redisClient.get(registrationKey);

	if (!redisUserData) {
		throw new AppError(httpStatus.NOT_FOUND, "Registration Data Not Found Or Expired");
	}

	const userPayload: { name: string; email: string; password: string } = JSON.parse(redisUserData);

	const createdUser = await prisma.user.create({
		data: {
			name: userPayload.name,
			email: userPayload.email,
			password: userPayload.password,
			role: Role.USER,
	status:UserStatus.ACTIVE,
			emailVerified: true,
		},
		omit: { password: true },
	});

	await redisClient.del(registrationKey);

	await sendTemplateEmail("patient-welcome-email.ejs", createdUser.email, "Welcome To PH Healthcare System", {
		name: createdUser.name,
	});

	const tokens = generateAuthTokens(createdUser);

	return {
		user: createdUser,
		...tokens,
	};
};

// ---------------------------------------------------------------------------
// Role selection — call AFTER verifyEmail/login, once user decides.
// ---------------------------------------------------------------------------
const becomeDonor = async (userId: string, payload: IBecomeDonorPayload) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}
	if (!user.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
	}
	if (user.role !== Role.USER) {
		throw new AppError(httpStatus.BAD_REQUEST, "User Already Has A Role Assigned");
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			role: Role.DONOR,
			donor: {
				create: {
					name: user.name,
					email: user.email,
					phoneNo: payload.phoneNo,
					address: payload.address,
					bloodGroup: payload.bloodGroup,
				},
			},
		},
		omit: { password: true },
		include: { donor: true },
	});

	return updatedUser;
};

const becomePatient = async (userId: string, payload: IBecomePatientPayload) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}
	if (!user.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
	}
	if (user.role !== Role.USER) {
		throw new AppError(httpStatus.BAD_REQUEST, "User Already Has A Role Assigned");
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			role: Role.PATIENT,
			patient: {
				create: {
					name: user.name,
					email: user.email,
					phoneNo: payload.phoneNo,
					address: payload.address,
					bloodGroup: payload.bloodGroup,
				},
			},
		},
		omit: { password: true },
		include: { patient: true },
	});

	return updatedUser;
};

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}
	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}
	if (user.isDeleted || user.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
	}
	if (user.password === null && user.googleId !== null) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User Already Has Account Registered With Google. Try To Login With Google.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password as string);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
	}

	return generateAuthTokens(user);
};

// ---------------------------------------------------------------------------
// Get current user
// ---------------------------------------------------------------------------
const getMe = async (user: IRequestUser) => {
	const isUserExists = await prisma.user.findUnique({
		where: { id: user.userId },
		include: { patient: true, donor: true },
		omit: { password: true },
	});

	if (!isUserExists) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return isUserExists;
};

// ---------------------------------------------------------------------------
// Refresh token
// ---------------------------------------------------------------------------
const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			config.node_env === "development" ? verifiedRefreshToken.error : "Invalid refresh token",
		);
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({ where: { id: data.userId } });

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is inactive or not found");
	}

	return generateAuthTokens(user);
};

// ---------------------------------------------------------------------------
// Google login — also creates base user only, role = USER
// ---------------------------------------------------------------------------
const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});
		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.log("Google ID Token Verification Failed", error);
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Or Expired Google Id Token");
	}

	if (!googleIdTokenPayload) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Or Expired Google Id Token");
	}
	if (!googleIdTokenPayload.email) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found");
	}
	if (!googleIdTokenPayload.name) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google Email User Name Not Found");
	}

	let user = await prisma.user.findUnique({
		where: { email: googleIdTokenPayload.email },
	});

	if (!user) {
		// Brand new user via Google — base user only, role undecided
		user = await prisma.user.create({
			data: {
				name: googleIdTokenPayload.name,
				email: googleIdTokenPayload.email,
				role: Role.USER,
				googleId: googleIdTokenPayload.sub,
				authProvider: AuthProvider.GOOGLE,
				emailVerified: true,
			},
		});

		await sendTemplateEmail("patient-welcome-email.ejs", user.email, "Welcome To PH Healthcare System", {
			name: user.name,
		});
	} else {
		if (user.status === UserStatus.BLOCKED) {
			throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
		}
		if (user.isDeleted || user.status === UserStatus.DELETED) {
			throw new AppError(httpStatus.FORBIDDEN, "User Is Deleted");
		}

		// Existing credential user logging in with Google for the first time — link accounts
		if (!user.googleId) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: { googleId: googleIdTokenPayload.sub },
			});
		}
	}

	return generateAuthTokens(user);
};

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------
const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const { email } = payload;

	const isUserExist = await prisma.user.findUnique({ where: { email } });

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
	}
	if (isUserExist.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}
	if (!isUserExist.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
	}
	if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
	}
	if (isUserExist.googleId && isUserExist.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User Has Account With Google");
	}

	const otp = crypto.randomInt(100000, 1000000).toString();
	const key = `forgot-password-otp:${isUserExist.email}`;
	const expirationSeconds = 5 * 60;

	await redisClient.set(key, otp, {
		expiration: { type: "EX", value: expirationSeconds },
	});

	await sendTemplateEmail("forgot-password.ejs", isUserExist.email, "Forgot Password", {
		name: isUserExist.name,
		otp,
		expirationMinutes: expirationSeconds / 60,
	});
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const { email, otp, newPassword } = payload;

	const isUserExist = await prisma.user.findUnique({ where: { email } });

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
	}
	if (isUserExist.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}
	if (!isUserExist.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
	}
	if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
	}
	if (isUserExist.googleId && isUserExist.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User Has Account With Google");
	}

	const key = `forgot-password-otp:${isUserExist.email}`;
	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
	}
	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
	}

	const hashedNewPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

	await prisma.user.update({
		where: { email: isUserExist.email },
		data: { password: hashedNewPassword },
	});

	await redisClient.del([key]);

	await sendTemplateEmail("reset-password-success.ejs", isUserExist.email, "Password Changed", {
		name: isUserExist.name,
	});
};

export const AuthService = {
	registerUser,
	verifyEmail,
	becomeDonor,
	becomePatient,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
};