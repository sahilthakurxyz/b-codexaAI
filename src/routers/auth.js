import express from "express";
import {
  loadUser,
  loginUser,
  logout,
  registerUser,
} from "../controllers/auth.js";
import { authentication } from "../middlewares/authentication.js";
import { refreshTokenFn } from "../utils/refreshToken.js";

const router = express.Router();

router.route("/auth/login").post(loginUser);
router.route("/auth/register").post(registerUser);
router.route("/auth/me").get(authentication, loadUser);
router.route("/auth/refresh-token").get(refreshTokenFn);
router.route("/auth/logout").get(authentication, logout);
export default router;
