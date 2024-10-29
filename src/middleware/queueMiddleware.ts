import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
  userId?: string;
}
export const queueMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const session = req.cookies.vibeIdR; // Access the session cookie

  try {
    if (session) {
      // Verify the JWT token
      const decoded: any = jwt.verify(session, process.env.JWT_SECRET || "");

      // Check if the decoded token contains a valid userId
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: "Invalid token" }); // Use 401 for invalid token
      }

      // Attach userId to the request object for further use
      req.userId = decoded.userId;
    }
    // Call the next middleware or route handler
    next();
  } catch (error: any) {
    // Handle token verification errors
    return res
      .status(403)
      .json({ message: "Token verification failed", error: error.message });
  }
};
