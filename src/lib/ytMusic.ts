import YTMusic from "ytmusic-api";
const ytmusic = new YTMusic();

(async () => {
  await ytmusic.initialize({
    cookies: process.env.COOKIES,
  });
})();
export default ytmusic;
