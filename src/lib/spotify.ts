import spotifyWebApi from "spotify-web-api-node";

const Spotify = new spotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

(async () => {
  const token = await Spotify.clientCredentialsGrant();
  Spotify.setAccessToken(token.body["access_token"]);
})();
export default Spotify;
