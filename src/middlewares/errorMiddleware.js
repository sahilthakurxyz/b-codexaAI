import AppError from "../utils/AppError.js";

// MONGOOSE CAST ERROR   (Invalid objectId)
const handleCastDBError = (err) => {
  // console.log(err, "error");
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};
// MONGOOSE DUPLICATE KEY
const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue).join(", ");
  return new AppError(`Duplicate field value: ${value}`, 400);
};
// MONGOOSE VALIDATION ERROR
const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${messages.join(". ")}`, 400);
};

// JWT INVALID TOKEN
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401, "INVALID_TOKEN");

const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    code: err.code,
    error: err,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
  // unknown error that don't need to expose
  // console.log(`Error ${err}`);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  let error = { ...err };
  error.message = err.message;

  // MONGOOSE
  if (err.name === "CastError") error = handleCastDBError(err);

  if (err.code === 11000) error = handleDuplicateFieldsDB(err);

  if (err.name === "ValidationError") error = handleValidationErrorDB(err);

  //  JWT
  if (err.name === "JsonWebTokenError") error = handleJWTError();

  if (err.name === "TokenExpiredError") {
    if (err.code === "REFRESH_TOKEN_EXPIRED") {
      error = new AppError(
        "Refresh token expired. Please login again",
        401,
        "REFRESH_TOKEN_EXPIRED",
      );
    } else {
      error = new AppError(
        "Access token expired.",
        401,
        "ACCESS_TOKEN_EXPIRED",
      );
    }
  }
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
