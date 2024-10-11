const RPC = require("discord-rpc");
const clientId = "1294367228212547658"; // Your Client ID

// URL for the button
const joinRoomUrl = "https://vibe-drx.vercel.app/v?room=G39kTxng"; // Replace with your actual room URL

// Create the RPC client
const rpc = new RPC.Client({ transport: "ipc" });

rpc.on("ready", () => {
  console.log("RPC connected.");

  // Basic Rich Presence with just a button
  const activity = {
    details: "Listening to music",
    state: "In a session",

    largeImageKey:
      "https://c.saavncdn.com/372/Starboy-English-2016-500x500.jpg",
    smallImageKey:
      "https://lh3.googleusercontent.com/a/ACg8ocLKSJqPDigLKMJhdNMWLA2Q_xibaGfGMdzSs5UzC1NqOLOnNhs=s96-c",
    largeImageText: "vibe",
    smallImageText: "demo",
    partyId: "ae488379-351d-4a4f-ad32-2b9b01c91657",
    partySize: 1,
    partyMax: 10,
    buttons: [
      {
        label: "Join Room", // Button label
        url: joinRoomUrl, // Button URL
      },
    ],
  };

  // Set the rich presence activity
  rpc.setActivity(activity);
  console.log("Rich Presence set.");
});

// Login to Discord with the client ID
rpc.login({ clientId }).catch(console.error);
