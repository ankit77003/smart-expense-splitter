import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI;  // get URI from env
  if (!uri) throw new Error("Missing MONGO_URI environment variable");

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set("strictQuery", true);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}