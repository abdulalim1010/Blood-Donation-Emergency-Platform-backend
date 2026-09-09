import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { UserRoutes } from "./app/module/user/user.route.js";
import { AuthRoutes } from "./app/module/auth/auth.route.js";
import { PatientRoutes } from "./app/module/patient/patient.route.js";
import { BloodRequestRoutes } from "./app/module/blood-request/blood-request.route.js";
import { DonorRoutes } from "./app/module/donor/donor.route.js";
import { PaymentRoutes } from "./app/module/payment/payment.route.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import config from "./app/config/index.js";

const app = express();

app.use(
  cors({
    origin: config.frontend_url || true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/patient", PatientRoutes);
app.use(
  "/api/v1/patient/blood-requests",
  BloodRequestRoutes,
);
app.use(
  "/api/v1/donor",
  DonorRoutes,
);
app.use(
  "/api/v1/payment",
  PaymentRoutes,
);

app.use(notFound);
app.use(globalErrorHandler);

export default app;