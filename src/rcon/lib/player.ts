const versionRegex = /(?<=\[).+?(?=\])/;
const serverNameRegex = /(?<=\] ).*/;

export function splitInfo(serverName: string): { "name": string, "ver": string} {
  return { "name": getServerName(serverName), "ver": getVersion(serverName)};
}

function getVersion(data: string) {
  const version = data.match(versionRegex);
  if (version) return version[0];
  return 'NaN';
}

function getServerName(data: string) {
  const version = data.match(serverNameRegex);
  if (version) return version[0];
  return 'NaN';
}

export function parsePlayers(data: string): any {
  const playerRows = data
    .split('\n')
    .slice(1)
    .filter((row) => row != '');

  const players = playerRows.map((row: string) => {
    const values = row.split(',');
    return {
      name: values[0],
      playeruid: values[1],
      steamid: values[2],
    };
  });

  // Return the object in the IrconPlayers format
  return { players }; 
}
