import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import User from "../models/userModel";
import { discordUser } from "../../types";
import { setJWTTokens } from "./Login";

export const discordLogin = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const login = req.query.login;
  if (login) {
    return res.redirect(
      process.env.DISCORD_URI + "&state=" + login || ""
    ) as any;
  }
  const token = req.query.access_token;
  const roomId = req.query.state;
  let redirectUrl = `${process.env.ALLOWED_URL}/v?room=${roomId}`;
  if (token) {
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new ApiError("invalid access token");
    const verify = (await response.json()) as discordUser;
    redirectUrl = `${process.env.ALLOWED_URL}/v?room=${
      roomId ? roomId : verify.global_name
    }`;

    console.log("discord user data", verify);

    const isAlready = await User.findOne({
      email: verify.email,
      provider: "discord",
    }).select("_id");

    if (isAlready) {
      return await setJWTTokens(res, isAlready, redirectUrl);
    }
    const user = await User.create({
      username: verify.username + "#" + verify.id.slice(0, 4),
      name: verify.global_name || verify.username + "#" + verify.id.slice(0, 4),
      email: verify.email,
      imageUrl: `https://cdn.discordapp.com/avatars/${verify.id}/${verify.avatar}`,
      provider: "discord",
    });

    return await setJWTTokens(res, user, redirectUrl);
  }
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vibe beta</title>
    </head>
    <body>
      <script>
        // Extract the access_token from the URL fragment (after '#')
        const fragment = window.location.hash.substring(1); // Get the string after '#'
        const params = new URLSearchParams(fragment); // Parse the fragment as query parameters

        const accessToken = params.get('access_token'); // Get the access_token
        const state = params.get('state'); // Get the access_token

        if (accessToken) {
          // Redirect to the same URL with the token as a query parameter
          const currentUrl = window.location.origin + window.location.pathname; // Get current base URL
          window.location.href = currentUrl + '?access_token=' + accessToken + "&state=" + state ; // Redirect with token in the query
        } else {
          window.location.href = "${redirectUrl}"
        }
      </script>
    </body>
  </html>
`;

  return res.send(htmlContent);
};
