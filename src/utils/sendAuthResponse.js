import crypto from "crypto";
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/generateToken.js";
export const sendAuthResponse = async (user, res, statusCode = 200) => {
  const refreshToken = createRefreshToken(user?._id);
  const accessToken = await createAccessToken(user?._id);
  const createHashToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  user.dbtoken = createHashToken;
  await user.save();
  user.password = undefined;
  const userObj = user.toObject();
  const info = {
    _id: userObj?._id,
    name: userObj?.name,
    email: userObj?.email,
  };
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // sameSite: "lax",
      sameSite: "none",
      maxAge: 4 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    .status(statusCode)
    .json({
      success: true,
      message: "request successful",
      user: info,
    });
};
