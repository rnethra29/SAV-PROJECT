import { Router } from "express";
import { healthRouter } from "./health.route";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);

// Module routes (auth, RBAC, organization, etc.) are mounted here
// once their respective modules are implemented and approved.
