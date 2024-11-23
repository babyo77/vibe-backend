import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import { decryptObjectValues } from "../lib/utils";

export const submitFeedback = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;
  const payload = req.body;
  const data = decryptObjectValues(payload);
  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL || "";
  if (!data.log || data.nxt || data.xhr) return res.status(204).send();
  if (data.log.length > 170) throw new ApiError("Message too long");
  const userDetails = {
    id: userId || "@someone",
    ip: data.xhr,
    room: data.nxt,
    device: req.headers["user-agent"],
    message: data.log,
  };

  const embedMessage = {
    content: null,
    embeds: [
      {
        title: "⚡️ User Feedback Report",
        description: "Below are the details of user:",
        color: 0x3498db,
        fields: [
          { name: "🆔 User ID", value: `\`${userDetails.id}\``, inline: false },
          {
            name: "🌐 IP Address",
            value: `\`${userDetails.ip}\``,
            inline: false,
          },
          {
            name: "📍 Room ID",
            value: `\`${userDetails.room}\``,
            inline: false,
          },
          {
            name: "📱 Device Info",
            value: `\`${userDetails.device}\``,
            inline: false,
          },
          {
            name: "🔫 Message",
            value: `\`${userDetails.message}\``,
            inline: false,
          },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embedMessage),
  });

  if (response.ok) {
    return res.status(204).send();
  }

  throw new ApiError("");
};
