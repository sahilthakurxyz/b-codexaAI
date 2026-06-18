import mongoose from "mongoose";

const messagesSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["streaming", "completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  },
);

export const Messages = mongoose.model("Messages", messagesSchema);
