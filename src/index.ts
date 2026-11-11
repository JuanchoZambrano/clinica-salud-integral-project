import express from "express";
import type { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes/index.js";
import swaggerRouter from "./routes/swaggerRoutes.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

app.use("/api", routes)
app.use("/api/docs", swaggerRouter);

app.listen(PORT, () => {
  console.log("SERVIDOR CORRIENDO EN http://localhost:3000");
});