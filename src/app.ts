import express from "express";
import { UserRoutes } from "./app/module/user/user.route.js";
import { AuthRoutes } from "./app/module/auth/auth.route.js";
import { PatientRoutes } from "./app/module/patient/patient.route.js";
import cookieParser from "cookie-parser";
import { BloodRequestRoutes } from "./app/module/blood-request/blood-request.route.js";


const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/patient", PatientRoutes);
app.use(
  "/api/v1/patient/blood-requests",
  BloodRequestRoutes,
);

export default app;