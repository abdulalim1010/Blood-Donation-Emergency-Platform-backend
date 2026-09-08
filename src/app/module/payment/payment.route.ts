import { Router } from "express";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validRequest.js";

import { PaymentValidation } from "./payment.validation.js";
import { PaymentController } from "./payemnt.controller.js";

const router = Router();

router.post(
  "/create",
  auth(),
  validateRequest(
    PaymentValidation.CreatePaymentZodSchema,
  ),
  PaymentController.createPayment,
);

router.post(
  "/execute",
  auth(),
  PaymentController.executePayment,
);

router.get(
  "/my-payments",
  auth(),
  PaymentController.getMyPayments,
);

router.get(
  "/donations",
  PaymentController.getPublicDonations,
);

router.get(
  "/:id",
  auth(),
  PaymentController.getPaymentById,
);

export const PaymentRoutes = router;