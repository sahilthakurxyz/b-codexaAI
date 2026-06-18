import { catchAsync } from "../middlewares/catchAsyncWrapper.js";
import { Conversation } from "../models/conversation.js";
import { Messages } from "../models/messages.js";
import { generateAIResponse, generateAITitle } from "../utils/ai.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
// import { getProperMessage } from "../utils/messageMatcher.js";

export const messagesController = catchAsync(async (req, res) => {
  let { conversationId, message, userId } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) {
    res.flushHeaders();
  }
  const controller = new AbortController();
  let clientDisconnect = false;
  req.on("aborted", () => {
    controller.abort();
    clientDisconnect = true;
  });
  let conversation = null;

  if (!conversationId) {
    const title = await generateAITitle(message);

    conversation = await Conversation.create({
      title,
      userId,
    });
    conversationId = conversation._id;
  }
  res.write(
    `data:${JSON.stringify({
      type: "conversation",
      conversation,
    })}\n\n`,
  );
  const userMessage = await Messages.create({
    conversationId,
    role: "user",
    content: message,
  });

  res.write(
    `data:${JSON.stringify({
      type: "user",
      message: userMessage,
    })}\n\n`,
  );

  const assistantMessageId = new mongoose.Types.ObjectId();

  const assistantMessage = await Messages.create({
    _id: assistantMessageId,
    conversationId,
    role: "assistant",
    content: "",
    status: "streaming",
  });

  res.write(
    `data:${JSON.stringify({
      type: "assistant-start",
      message: assistantMessage,
    })}\n\n`,
  );
  let fullResponse = "";

  try {
    const stream = await generateAIResponse(message);

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content;

      if (!token) continue;

      fullResponse += token;

      res.write(
        `data:${JSON.stringify({
          type: "token",
          messageId: assistantMessageId,
          content: token,
        })}\n\n`,
      );
    }

    await Messages.findByIdAndUpdate(assistantMessageId, {
      content: fullResponse,
      status: "completed",
    });

    res.write(
      `data:${JSON.stringify({
        type: "done",
        messageId: assistantMessageId,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error(error);

    await Messages.findByIdAndUpdate(assistantMessageId, {
      content: fullResponse,
      status: "failed",
    });

    res.write(
      `data:${JSON.stringify({
        type: "error",
        message: "Something went wrong.",
      })}\n\n`,
    );

    res.end();
  }
  //  old without stream code

  // const messageResponse = await generateAIResponse(message);
  // const titleResponse = await generateAITitle(message);
  // let conversation = null;
  // if (!conversationId) {
  //   conversation = await Conversation.create({
  //     title: titleResponse,
  //     userId: userId,
  //   });
  //   conversationId = conversation._id;
  // }
  // const newUserMessage = await Messages.create({
  //   conversationId,
  //   role: "user",
  //   content: message,
  // });
  // const newAssitantMessage = await Messages.create({
  //   conversationId,
  //   role: "assistant",
  //   content: messageResponse.content,
  // });
  // res.status(200).json({
  //   conversation,
  //   user: newUserMessage,
  //   assistant: newAssitantMessage,
  // });
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
