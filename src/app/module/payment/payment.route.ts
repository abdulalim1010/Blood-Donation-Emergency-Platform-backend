import { Router } from "express";
import { PaymentController } from "./payemnt.controller.js";
import { PaymentValidation } from "./payment.validation.js";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validRequest.js";


const router = Router();

/* =========================================
   CREATE PAYMENT
========================================= */

router.post(
  "/create",
  auth(),
  validateRequest(PaymentValidation.CreatePaymentZodSchema),
  PaymentController.createPayment,
);


/* =========================================
   BKASH CALLBACK

   IMPORTANT:
   এখানে auth() দেওয়া যাবে না
========================================= */

router.get(
  "/callback",
  PaymentController.bkashCallback,
);


/* =========================================
   EXECUTE PAYMENT
   Manual/internal testing-এর জন্য
========================================= */

router.post(
  "/execute",
  auth(),
  PaymentController.executePayment,
);


/* =========================================
   MY PAYMENTS
========================================= */

router.get(
  "/my-payments",
  auth(),
  PaymentController.getMyPayments,
);


/* =========================================
   PUBLIC DONATIONS
========================================= */

router.get(
  "/donations",
  PaymentController.getPublicDonations,
);


/* =========================================
   PAYMENT BY ID
========================================= */

router.get(
  "/:id",
  auth(),
  PaymentController.getPaymentById,
);

export const PaymentRoutes = router;