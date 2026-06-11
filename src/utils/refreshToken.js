import { catchAsync } from "../middlewares/catchAsyncWrapper.js";
import { User } from "../models/user.js";
import AppError from "./AppError.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendAuthResponse } from "./sendAuthResponse.js";
export const refreshTokenFn = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return next(new AppError("Unauthorized", 401, "NO_REFRESH_TOKEN"));
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
  } catch (err) {
    console.log("refesh token expire error in refresh token function", err);
    if (err.name === "TokenExpiredError") {
      err.code = "REFRESH_TOKEN_EXPIRED";
    }
    return next(err);
  }
  const user = await User.findById(decoded?.userId);
  if (!user) return next(new AppError("User not found", 404));
  if (!user.dbtoken) {
    return next(new AppError("No active session. Please login again", 401));
  }
  const hashRefreshToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  // console.log(hashRefreshToken.length, user.dbtoken.length);
  // console.log(JSON.stringify(hashRefreshToken));
  // console.log(JSON.stringify(user.dbtoken));

  if (hashRefreshToken !== user?.dbtoken) {
    user.dbtoken = null;
    await user.save();
    return next(
      new AppError(
        "Refresh token already used or invalid",
        401,
        "TOKEN_REUSED",
      ),
    );
  }
  sendAuthResponse(user, res, 200);
});
