import { Router } from "express";
import { login, refreshToken, register } from "../controllers/auth.controller";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest";

const router = Router();

router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required."),
    body("email").isEmail().withMessage("Please provide a valid email."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("Please provide a valid email.")],
  validateRequest,
  login
);

router.post("/refresh", refreshToken);

export default router;
