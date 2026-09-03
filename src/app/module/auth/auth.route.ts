import { Router } from "express";
import { UserValidation } from "./auth.validation.js";
import { Role } from "../../../generated/prisma/enums.js";

import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validRequest.js";
import { auth } from "../../middleware/checkAuth.js";


const router = Router();

router.post(
	"/register",
	// (req : Request, res : Response, next : NextFunction) => {

	// 	try {
	// 		// const payload = req.body ? req.body : {}
	// 		const payload = req.body ?? {}

	// 		const result = PatientValidation.PatientRegistrationZodSchema.safeParse(payload);

	// 		if (!result.success) {
	// 			console.log(result.error);
	// 			console.log(result.error.issues);

	// 			throw new Error(result.error.issues[0].message)
	// 		}

	// 		req.body = result.data

	// 		next()
	// 	} catch (error) {

	// 		next(error)
	// 	}
	// },

	validateRequest(UserValidation.PatientRegistrationZodSchema),
	AuthController.registerPatient,
);
router.post(
	"/verify-email",
	validateRequest(UserValidation.PatientEmailVerifyZodSchema),
	AuthController.verifyPatientEmail,
);
router.post(
	"/login",
	validateRequest(UserValidation.LoginZodSchema),
	AuthController.loginUser,
);
router.get(
	"/me",
	auth(Role.ADMIN, Role.DONOR, Role.PATIENT, Role.SUPER_ADMIN),
	// validateRequest
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/", AuthController.googleLogin);
router.post(
	"/forgot-password",
	validateRequest(UserValidation.ForgotPasswordZodSchema),
	AuthController.forgotPassword,
);
router.post(
	"/reset-password",
	validateRequest(UserValidation.ResetPasswordZodSchema),
	AuthController.resetPassword,
);
export const AuthRoutes = router;
