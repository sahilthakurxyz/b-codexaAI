import express, { urlencoded } from "express";

import authRoute from "./src/routers/auth.js";
import chatRoute from "./src/routers/chat.js";
import { globalErrorHandler } from "./src/middlewares/errorMiddleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
export const app = express();
app.use(express.json());
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET,HEAD,POST,PATCH,DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.options("*", cors({ origin: process.env.FRONTEND_URL }));
app.use("/api/ai/v1/", authRoute);
app.use("/api/ai/v1/chat/", chatRoute);
app.use(globalErrorHandler);
