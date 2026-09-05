import { Router } from "express";

import { Role } from "../../../generated/prisma/enums.js";

import { auth } from "../../middleware/checkAuth.js";

import { validateRequest } from "../../middleware/validRequest.js";

import { DonorController } from "./donor.controller.js";
import { DonorValidation } from "./donor.validation.js";




const router = Router();


// Create Donor Profile
router.post(
  "/profile",
  auth(),
  validateRequest(
    DonorValidation.DonorProfileZodSchema,
  ),
  DonorController.createDonorProfile,
);


// Get My Donor Profile
router.get(
  "/profile",
  auth(),
  DonorController.getMyDonorProfile,
);


// Update My Donor Profile
router.patch(
  "/profile",
  auth(),
  validateRequest(
    DonorValidation.UpdateDonorProfileZodSchema,
  ),
  DonorController.updateMyDonorProfile,
);


// Delete My Donor Profile
router.delete(
  "/profile",
  auth(),
  DonorController.deleteMyDonorProfile,
);


// Get All Donors
router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  DonorController.getAllDonors,
);


// Search Donors
router.get(
  "/search",
  auth(),
  DonorController.searchDonors,
);


export const DonorRoutes = router;