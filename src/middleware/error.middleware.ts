import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ err }, "Unhandled error");

  if (err instanceof Error) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
};
