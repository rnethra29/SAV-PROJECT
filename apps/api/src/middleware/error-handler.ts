import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { env } from "../config/env";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, path: req.path }, "Non-operational application error");
    }

    res.status(err.statusCode).json({
      error: {
        message: err.message,
      },
    });
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled error");

  res.status(500).json({
    error: {
      message: env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message,
    },
  });
}
