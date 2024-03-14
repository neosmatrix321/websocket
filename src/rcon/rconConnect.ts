// import { RconConnection } from './lib/server/connection';


// const rconConnection = new RconConnection();

// export async function GET() {
//   if (!rconConnection.connected) {
//     try {
//       const RCON_HOSTNAME = "192.168.228.7";
//       const RCON_PORT = 9998;
//       const RCON_PASSWORD = "Descent3$";

//       await rconConnection.connect(RCON_HOSTNAME, RCON_PORT, RCON_PASSWORD);
//     } catch (err: any) {
//       return err.message;
//     }
//   }

//   const info = (await rconConnection.exec('Info')).body;
//   const players = (await rconConnection.exec('ShowPlayers')).body;

//   return JSON.stringify({
//     info: info,
//     players: players,
//   });
// }
