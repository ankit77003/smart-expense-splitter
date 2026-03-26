import mongoose from "mongoose";

export async function connectDb(uri) {
  let uri=await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  if (!uri) throw new Error("Missing MONGODB_URI");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

