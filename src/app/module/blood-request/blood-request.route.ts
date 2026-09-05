import { Router } from "express";

import { auth } from "../../middleware/checkAuth.js";

import { validateRequest } from "../../middleware/validRequest.js";

import { BloodRequestController } from "./blood-request.controller.js";

import { BloodRequestValidation } from "./blood-request.validation.js";


const router = Router();


// Create Blood Request
router.post(
  "/",
  auth(),
  validateRequest(
    BloodRequestValidation.BloodRequestZodSchema,
  ),
  BloodRequestController.createBloodRequest,
);


// Get My Blood Requests
router.get(
  "/",
  auth(),
  BloodRequestController.getMyBloodRequests,
);


// Search Blood Requests
// IMPORTANT: /search must be before /:id
router.get(
  "/search",
  auth(),
  BloodRequestController.searchBloodRequests,
);


// Get Single Blood Request
router.get(
  "/:id",
  auth(),
  BloodRequestController.getBloodRequestById,
);


// Update Blood Request
router.patch(
  "/:id",
  auth(),
  validateRequest(
    BloodRequestValidation.UpdateBloodRequestZodSchema,
  ),
  BloodRequestController.updateBloodRequest,
);


// Delete Blood Request
router.delete(
  "/:id",
  auth(),
  BloodRequestController.deleteBloodRequest,
);


export const BloodRequestRoutes = router;