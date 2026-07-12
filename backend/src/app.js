import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler); // must be last

export default app; 
