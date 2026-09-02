import express from "express";
import { UserRoutes } from "./app/module/user/user.route.js";
import { AuthRoutes } from "./app/module/auth/auth.route.js";


const app = express();

app.use(express.json());

app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/auth", AuthRoutes);

export default app;