const RPC = require("discord-rpc");
const clientId = "1294367228212547658"; // Your Client ID
const joinRoomUrl = "https://vibe-drx.vercel.app/v?room=DMpUlMqS"; // Replace
const rpc = new RPC.Client({ transport: "ipc" });
rpc.on("ready", () => {
  console.log("RPC connected.");
  const activity = {
    details: "Listening to One Dance",
    state: "by TommyMuzzic",
    largeImageKey:
      "https://c.saavncdn.com/070/One-Dance-Unknown-2024-20240326120906-500x500.jpg",
    smallImageKey:
      "https://lh3.googleusercontent.com/a/ACg8ocLKSJqPDigLKMJhdNMWLA2Q_xibaGfGMdzSs5UzC1NqOLOnNhs=s96-c",
    largeImageText: "Fighting Demons",
    smallImageText: "Tanmay",

    buttons: [
      {
        label: "Listen Together", // Button label
        url: joinRoomUrl, // Button URL
      },
    ],
  };
  rpc.setActivity(activity);
  console.log("Rich Presence set.");
});
rpc.login({ clientId }).catch(console.error);
