import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { apiRateLimit } from "./middleware/rate-limit.middleware";
import { errorHandler } from "./middleware/error.middleware";
import routes from "./routes";
import { startSprintRefreshJob } from "./jobs/sprint-refresh.job";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("combined"));
app.use(pinoHttp({ logger }));
app.use(apiRateLimit);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
  startSprintRefreshJob();
});
