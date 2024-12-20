import { Response } from "express";
import { CustomRequest } from "../middleware/auth";

export async function pingVibe(
  _req: CustomRequest,
  res: Response
): Promise<Response> {
  return res.status(204).send();
}
