import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../functions/apiError";

export interface CustomRequest extends Request {
  userId?: string;
}
export const authMiddleware = (
  req: CustomRequest,
  _res: Response,
  next: NextFunction
) => {
  const session = req.cookies.vibeIdR || req.headers.authorization; // Access the session cookie

  // Check if the session cookie is present
  if (!session) {
    throw new ApiError("Login required", 401); // Use 401 for unauthorized
  }

  try {
    // Verify the JWT token
    const decoded: any = jwt.verify(session, process.env.JWT_SECRET || "");

    // Check if the decoded token contains a valid userId
    if (!decoded || !decoded.userId) {
      throw new ApiError("Invalid credentials", 401); // Use 401 for invalid token
    }

    // Attach userId to the request object for further use
    req.userId = decoded.userId;

    // Call the next middleware or route handler
    next();
  } catch (error: any) {
    throw error;
  }
};
