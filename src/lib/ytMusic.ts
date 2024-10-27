import YTMusic from "ytmusic-api";
const ytmusic = new YTMusic();
ytmusic.initialize({
  cookies: process.env.COOKIES,
});

export default ytmusic;
