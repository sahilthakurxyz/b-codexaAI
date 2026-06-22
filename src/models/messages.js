import mongoose from "mongoose";

const messagesSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
    contentType: { type: String, default: "text/markdown" }, // "application/pdf" | "image/jpeg" | "text/markdown"
    type: { type: String, default: "general" }, // intent type from classifier
    status: {
      type: String,
      enum: ["streaming", "completed", "failed", "aborted"],
      default: "streaming",
    },
  },
  { timestamps: true },
);

export const Messages = mongoose.model("Messages", messagesSchema);
