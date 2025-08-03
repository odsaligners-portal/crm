import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "planner", "distributor"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      required: true,
    },
    commentedBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        enum: ["User", "Distributer"],
        required: true,
      },
    },
    recipients: [recipientSchema],
  },
  { timestamps: true }, 
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
