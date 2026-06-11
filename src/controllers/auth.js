import { catchAsync } from "../middlewares/catchAsyncWrapper.js";
import { User } from "../models/user.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcryptjs";
import { sendAuthResponse } from "../utils/sendAuthResponse.js";
export const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if ((!email, !password)) {
    return next(new AppError("All fields are required!", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("User not found!", 404));
  }
  if (!(await user.comparePassword(password))) {
    return next(new AppError("Invalid credentials", 401));
  }
  sendAuthResponse(user, res, 200);
});

export const registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User already exists", 409));
  }
  const user = await User.create({
    name,
    email,
    password,
  });
  sendAuthResponse(user, res, 201);
});

export const loadUser = catchAsync(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }
  const user = await User.findById(userId)
    .select("-password -dbtoken -__v")
    .lean();
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  if (user.isBlocked) {
    return next(new AppError("User is blocked", 403));
  }
  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const logout = catchAsync(async (req, res, next) => {
  const user = await User.findById(req?.user?.id);
  if (user) {
    user.dbtoken = undefined;
    await user.save();
  }
  res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});
