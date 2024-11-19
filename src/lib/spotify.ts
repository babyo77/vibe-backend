import spotifyWebApi from "spotify-web-api-node";
const secret = [
  {
    clientId: "ddf083a591a448089ae15e2ae725689c",
    clientSecret: "d7299778cf514687a865fc9f280032fa",
  },
  {
    clientId: "a9858d281030425a94171744d1921c7d",
    clientSecret: "f3d3d6fb01ec49b59e0878f4c5515741",
  },
];

const credentials = secret[Math.floor(Math.random() * secret.length)];
const Spotify = new spotifyWebApi({
  ...credentials,
});

export default Spotify;
