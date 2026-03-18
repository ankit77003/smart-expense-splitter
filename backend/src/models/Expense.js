import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    share: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 240 },
    amount: { type: Number, required: true, min: 0 },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: { type: [participantSchema], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    splitType: { type: String, enum: ["EQUAL", "CUSTOM"], default: "EQUAL" }
  },
  { timestamps: true }
);

expenseSchema.index({ group: 1, createdAt: -1 });

export const Expense = mongoose.model("Expense", expenseSchema);

