import type { BloodGroup } from "../../../generated/prisma/enums.js";

export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IBecomeDonorPayload {
	phoneNo: string;
	address: string;
	bloodGroup: BloodGroup; // import from generated/prisma/enums.js
}

export interface IBecomePatientPayload {
	phoneNo: string;
	address: string;
	bloodGroup: BloodGroup;
}

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IRequestUser {
	userId: string;
	name: string;
	email: string;
	role: string;
}