import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";

// Use Render's dynamic PORT, fallback to 5000 locally
const port = Number(process.env.PORT || 5000);

// Connect to MongoDB
await connectDb(process.env.MONGO_URI); // make sure your env variable is MONGO_URI, not MONGODB_URI

const app = createApp();

// Listen on the correct port
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});