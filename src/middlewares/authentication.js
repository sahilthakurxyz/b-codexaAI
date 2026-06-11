import { User } from "../models/user.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "./catchAsyncWrapper.js";
import jwt from "jsonwebtoken";
export const authentication = catchAsync(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next(new AppError("Unauthorized", 401, "NO_TOKEN"));
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    req.user = {
      id: decoded?.userId,
    };
    next();
  } catch (err) {
    // console.log(err, "inside authentication");
    if (err.name === "TokenExpiredError") {
      err.code = "ACCESS_TOKEN_EXPIRED";
    }

    return next(new AppError("Invalid token", 401));
  }
});
