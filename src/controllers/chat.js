import { catchAsync } from "../middlewares/catchAsyncWrapper.js";
import { Conversation } from "../models/conversation.js";
import { Messages } from "../models/messages.js";
import { generateAIResponse, generateAITitle } from "../utils/ai.js";
import AppError from "../utils/AppError.js";
// import { getProperMessage } from "../utils/messageMatcher.js";

export const messagesController = catchAsync(async (req, res) => {
  let { conversationId, message, userId } = req.body;

  const messageResponse = await generateAIResponse(message);
  const titleResponse = await generateAITitle(message);
  let conversation = null;
  if (!conversationId) {
    conversation = await Conversation.create({
      title: titleResponse,
      userId: userId,
    });
    conversationId = conversation._id;
  }
  const newUserMessage = await Messages.create({
    conversationId,
    role: "user",
    content: message,
  });
  const newAssitantMessage = await Messages.create({
    conversationId,
    role: "assistant",
    content: messageResponse.content,
  });
  res.status(200).json({
    conversation,
    user: newUserMessage,
    assistant: newAssitantMessage,
  });
});

export const getUserConversation = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const allConversation = await Messages.find({ conversationId: chatId })
    .select("-conversationId -createdAt -updatedAt -__v")
    .lean();
  if (allConversation.length === 0) {
    return next(new AppError("No conversation yet", 400));
  }
  res.status(200).json({
    success: true,
    messages: allConversation,
  });
});

export const getAllConversations = catchAsync(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return next(new AppError("User not find", 400));
  }
  const conversations = (await Conversation.find({ userId })).reverse();
  res.status(200).json({
    success: true,
    conversations,
  });
});
