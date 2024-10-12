// const RPC = require("discord-rpc");
// const clientId = "1294367228212547658"; // Your Client ID
// const joinRoomUrl = "https://vibe-drx.vercel.app/v?room=G39kTxng"; // Replace
// const rpc = new RPC.Client({ transport: "ipc" });
// rpc.on("ready", () => {
//   console.log("RPC connected.");
//   const activity = {
//     details: "Listening to music",
//     state: "In a session",

//     largeImageKey:
//       "https://cdn.discordapp.com/app-icons/1294367228212547658/4753c08b909b66bd08198fd70d549def.webp?size=512",
//     smallImageKey:
//       "https://lh3.googleusercontent.com/a/ACg8ocLKSJqPDigLKMJhdNMWLA2Q_xibaGfGMdzSs5UzC1NqOLOnNhs=s96-c",
//     largeImageText: "vibe",
//     smallImageText: "Tanmay",
//     partyId: "ae488379-351d-4a4f-ad32-2b9b01c91657",
//     partySize: 4,
//     partyMax: 20,
//     buttons: [
//       {
//         label: "Join Room", // Button label
//         url: joinRoomUrl, // Button URL
//       },
//     ],
//   };
//   rpc.setActivity(activity);
//   console.log("Rich Presence set.");
// });
// rpc.login({ clientId }).catch(console.error);
