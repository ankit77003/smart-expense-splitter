import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";

const port = Number(process.env.PORT || 5000);

await connectDb(process.env.MONGODB_URI);

const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

