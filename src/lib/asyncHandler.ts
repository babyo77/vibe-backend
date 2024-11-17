import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../middleware/auth";

type AsyncRequestHandler = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => Promise<Response>;

const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
