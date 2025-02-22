import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
export async function getLinkPreview(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const url = req.query.url;
  if (typeof url !== "string" || !url)
    throw new ApiError("Missing URL query parameter", 400);
  const response = await fetch(
    `https://api.dub.co/metatags?url=${encodeURIComponent(url)}`
  );

  if (response.ok) {
    return res.json(await response.json());
  }

  throw new ApiError();
}
