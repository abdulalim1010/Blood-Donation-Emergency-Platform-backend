import { Router } from "express";

import { PatientController } from "./patient.controller.js";
import { PatientValidation } from "./patient.validation.js";
import { validateRequest } from "../../middleware/validRequest.js";
import { auth } from "../../middleware/checkAuth.js";

const router = Router();

router.post(
  "/profile",
  auth(),
  validateRequest(PatientValidation.PatientProfileZodSchema),
  PatientController.createPatientProfile,
);

router.get(
  "/profile",
  auth(),
  PatientController.getMyPatientProfile,
);

router.patch(
  "/profile",
  auth(),
  validateRequest(PatientValidation.UpdatePatientProfileZodSchema),
  PatientController.updateMyPatientProfile,
);

router.delete(
  "/profile",
  auth(),
  PatientController.deleteMyPatientProfile,
);

export const PatientRoutes = router;