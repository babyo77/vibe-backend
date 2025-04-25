import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import * as cheerio from "cheerio";
export async function getLinkPreview(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const url = req.query.url;
  if (typeof url !== "string" || !url)
    throw new ApiError("Missing URL query parameter", 400);
  const body = await fetch(url);
  if (!body.ok) throw new ApiError("Failed to fetch URL", 500);
  const html = await body.text();
  const $ = cheerio.load(html);

  const title = $("title").text();
  const description = $('meta[name="description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");

  return res.json({
    title,
    description,
    ogImage,
  });
}

