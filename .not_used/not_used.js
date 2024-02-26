// class DataToSend {
//   static client_count;
  
//   constructor(client_count, latency_user, latency_google, client_ip, server_ip, process_info, pid_info) {
//     this.client.count = client_count;
//     this.client.ip = client_ip;
//     this.latency.user = latency_user;
//     this.latency.google = latency_google;
//     this.server.ip = server_ip;
//     this.process.cpu = proces_cpu;
//     this.pid.info = pid_info;
//   }
//   updateData(key, value) {
//     if (this.hasOwnProperty(key)) {
//       this[key] = value;
//     }
//   }
// }




// async function gatherInfos(client) {
//       data_to_send = {
//         "count": count,
//         "latency_user": client.latency_user,
//         "latency_google": client.latency_google,
//         "ip": client.ip,
//         "obj": await get_module_infos(), 
//         ...(client.admin === true ? { "extras_first_innerHTML": extras_first_innerHTML } : { "dummy": dummy })
//       };
//     }
//   }
//   return { "palserver_processinfo": palserver_processinfo, "palserver_pidinfo": palserver_pidinfo };
// }
// async function get_module_infos() {
//   pidusage(pid, function (err, data) {
//     pid_info = data;
//   });
//   return { "palserver_pidinfo": palserver_pidinfo, 'palserver_processinfo': palserver_processinfo };
// }
// function pingClient() {
//   if (client.isAlive === false) {
//     count--;
//     if (count == 0) clearInterval(interval_sendinfo);
//     return client.terminate();
//   }
//   client.isAlive = false;
//   client.ping();
// }

// async function setupClients() {
//   
  // await client.updateSystemInfo(); // Fetch initial data

  // If necessary, use server.pid to validate or further update `client.pid`
  // const serverPid = await getPidFromFile('/var/run/server.pid');
  // ... logic to compare with client.pid




  // await rcon_client.cmd('ShowPlayers').then((result) => {
//   console.log("rcon_client", rcon_client, "rcon_connecting", rcon_client.socket.connecting, "rcon_hadError", rcon_client.socket._hadError);
//   console.log(result);
// });
// process.exit(0);




console.log('ShowPlayers');
// conn.send("Info");
// const temp_interval = setInterval(() => { console.log("rcon_client", rcon_client); }, 10);

//  var temp_result = rcon_connect_send(rcon_client, 'ShowPlayers');
// sleep(3000);
// console.log("rcon_client", rcon_client, "rcon_connecting", rcon_client.socket.connecting, "rcon_hadError", rcon_client.socket._hadError, "temp_result", temp_result);
extras_first_innerHTML = "";

// console.log(value);
// // console.log(list);
// // clearInterval(temp_interval);
// console.log(pid_file_exists, typeof pid, pid);
// console.log(obj_to_send);
