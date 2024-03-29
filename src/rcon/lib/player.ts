import { IRconStatsInfo, IRconStatsPlayers } from "../../global/statsInstance";

const versionRegex = /(?<=\[).+?(?=\])/;
const serverNameRegex = /(?<=\] ).*/;

export function splitInfo(serverName: string): IRconStatsInfo {
  return { "name": getServerName(serverName), "ver": getVersion(serverName) };
}

function getVersion(data: string) {
  const version = data.match(versionRegex);
  if (!version || !version[0]) return 'NaN';
  return version[0];
}

function getServerName(data: string) {
  const version = data.match(serverNameRegex);
  if (!version || !version[0]) return 'NaN';
  return version[0];
}

export function parsePlayers(data: string): IRconStatsPlayers[] {
  const playerRows = data
    .split('\n')
    .slice(1)
    .filter((row) => row != '');

  const players = playerRows.map((row: string) => {
    const values = row.split(',');
    return {
      name: values[0] || "NaN",
      playeruid: values[1] || "NaN",
      steamid: values[2] || "NaN",
    };
  });

  // Return the object in the IrconPlayers format
  return players as IRconStatsPlayers[]; 
}
