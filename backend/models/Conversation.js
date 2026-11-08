const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
        role: { type: String },
      },
    ],
    lastMessage: { type: String },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

conversationSchema.index({ "participants.id": 1, lastMessageTime: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
