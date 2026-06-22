import { catchAsync } from "../middlewares/catchAsyncWrapper.js";
import { Conversation } from "../models/conversation.js";
import { Messages } from "../models/messages.js";
import { generateAITitle } from "../utils/ai.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import { SSEStream } from "../utils/sseStreams.js";
import { classifyMessage } from "../services/classifier.service.js";
import { resolveHandler } from "../services/router.service.js";
import { HANDLERS } from "../services/handlerRegistry.js";
// import { getProperMessage } from "../utils/messageMatcher.js";

export const messagesController = catchAsync(async (req, res) => {
  let { conversationId, message, userId } = req.body;
  const sse = new SSEStream(res).init();

  const controller = new AbortController();

  req.on("aborted", () => controller.abort());

  // ---- 1. Conversation bootstrap ------------------------------------
  let conversation = null;
  if (!conversationId) {
    const title = await generateAITitle(message);
    conversation = await Conversation.create({ title, userId });
    conversationId = conversation._id;
  }
  sse.send("conversation", { conversation });

  // ---- 2. Persist user message ---------------------------------------
  const userMessage = await Messages.create({
    conversationId,
    role: "user",
    content: message,
    status: "completed",
  });
  sse.send("user", { message: userMessage });
  // ---- 3. Classify intent ---------------------------------------------
  const { types, cleanedMessage } = await classifyMessage(message);

  const handlerConfig = resolveHandler(types);
  sse.send("classification", {
    types,
    matchedType: handlerConfig.matchedType,
    provider: handlerConfig.provider,
  });

  // const assistantMessageId = new mongoose.Types.ObjectId();

  // const assistantMessage = await Messages.create({
  //   _id: assistantMessageId,
  //   conversationId,
  //   role: "assistant",
  //   content: "",
  //   status: "streaming",
  // });

  // res.write(
  //   `data:${JSON.stringify({
  //     type: "assistant-start",
  //     message: assistantMessage,
  //   })}\n\n`,
  // );
  // ---- 4. Create assistant placeholder ---------------------------------
  const assistantMessageId = new mongoose.Types.ObjectId();
  const assistantMessage = await Messages.create({
    _id: assistantMessageId,
    conversationId,
    role: "assistant",
    content: "",
    status: "streaming",
    type: handlerConfig.matchedType,
  });
  sse.send("assistant-start", { message: assistantMessage });

  // ---- 5. Execute the right handler ------------------------------------
  const handlerFn = HANDLERS[handlerConfig.handler];
  if (!handlerFn) {
    return await failAssistantMessage(
      sse,
      assistantMessageId,
      "",
      `No handler registered for "${handlerConfig.handler}"`,
    );
  }
  try {
    if (handlerConfig.stream) {
      await runStreamingHandler({
        sse,
        handlerFn,
        handlerConfig,
        message: cleanedMessage,
        assistantMessageId,
        signal: controller.signal,
      });
    } else {
      await runNonStreamingHandler({
        sse,
        handlerFn,
        handlerConfig,
        message: cleanedMessage,
        assistantMessageId,
        signal: controller.signal,
      });
    }

    sse.send("done", { messageId: assistantMessageId });
    sse.end();
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn(
        `Client disconnected, request aborted for ${assistantMessageId}`,
      );
      await Messages.findByIdAndUpdate(assistantMessageId, {
        status: "aborted",
      });
      sse.end();
      return;
    }

    console.error("messagesController error:", error);
    await failAssistantMessage(
      sse,
      assistantMessageId,
      "",
      "Something went wrong.",
    );
  }

  // let fullResponse = "";
  // try {
  //   const stream = await generateAIResponse(message);

  //   for await (const chunk of stream) {
  //     const token = chunk.choices?.[0]?.delta?.content;

  //     if (!token) continue;

  //     fullResponse += token;

  //     res.write(
  //       `data:${JSON.stringify({
  //         type: "token",
  //         messageId: assistantMessageId,
  //         content: token,
  //       })}\n\n`,
  //     );
  //   }

  //   await Messages.findByIdAndUpdate(assistantMessageId, {
  //     content: fullResponse,
  //     status: "completed",
  //   });

  //   res.write(
  //     `data:${JSON.stringify({
  //       type: "done",
  //       messageId: assistantMessageId,
  //     })}\n\n`,
  //   );

  //   res.end();
  // } catch (error) {
  //   console.error(error);

  //   await Messages.findByIdAndUpdate(assistantMessageId, {
  //     content: fullResponse,
  //     status: "failed",
  //   });

  //   res.write(
  //     `data:${JSON.stringify({
  //       type: "error",
  //       message: "Something went wrong.",
  //     })}\n\n`,
  //   );

  //   res.end();
  // }
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

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/**
 * Streaming path: token events as they arrive, then a single DB write
 * once the stream completes.
 */
async function runStreamingHandler({
  sse,
  handlerFn,
  handlerConfig,
  message,
  assistantMessageId,
  signal,
}) {
  let fullResponse = "";

  for await (const token of handlerFn(handlerConfig, message, signal)) {
    fullResponse += token;
    sse.send("token", { messageId: assistantMessageId, content: token });
  }

  await Messages.findByIdAndUpdate(assistantMessageId, {
    content: fullResponse,
    status: "completed",
  });
}

/**
 * Non-streaming path (image/pdf/etc): wait for the full result, persist it,
 * then emit ONE event with the file metadata. No token-by-token writes.
 */
async function runNonStreamingHandler({
  sse,
  handlerFn,
  handlerConfig,
  message,
  assistantMessageId,
  signal,
}) {
  const result = await handlerFn(handlerConfig, message, signal);

  await Messages.findByIdAndUpdate(assistantMessageId, {
    content: result.url,
    contentType: result.mimeType,
    status: "completed",
  });

  sse.send("file-result", {
    messageId: assistantMessageId,
    fileType: result.fileType,
    mimeType: result.mimeType,
    url: result.url,
  });
}

async function failAssistantMessage(
  sse,
  assistantMessageId,
  partialContent,
  errorMessage,
) {
  await Messages.findByIdAndUpdate(assistantMessageId, {
    content: partialContent,
    status: "failed",
  });
  sse.send("error", { messageId: assistantMessageId, message: errorMessage });
  sse.end();
}

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
