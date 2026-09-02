import { Router } from "express";
import { UserController } from "./user.controller.js";

const router = Router();

router.post("/", UserController.createUser);
router.get("/", UserController.getAllUsers);
router.get("/:id", UserController.getSingleUser);

export const UserRoutes = router;