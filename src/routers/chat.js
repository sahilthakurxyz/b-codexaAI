import express from "express";
import {
  getAllConversations,
  getUserConversation,
  messagesController,
} from "../controllers/chat.js";
import { authentication } from "../middlewares/authentication.js";

const router = express.Router();

router.route("/message").post(messagesController);
router.route("/:chatId").get(getUserConversation);
router.route("/all/conversations").get(authentication, getAllConversations);
export default router;
