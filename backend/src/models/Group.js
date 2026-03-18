import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  },
  { timestamps: true }
);

groupSchema.index({ createdBy: 1, createdAt: -1 });

export const Group = mongoose.model("Group", groupSchema);

