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
  await fetch(`https://api.dub.co/metatags?url=${encodeURIComponent(url)}`);
  const response2 = await fetch(
    `https://api.dub.co/metatags?url=${encodeURIComponent(url)}`
  );

  if (response2.ok) {
    return res.json(await response2.json());
  }

  throw new ApiError();
}
