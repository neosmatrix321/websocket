"use strict";
import "reflect-metadata";

export interface IprivateSettings {
  adminPassword: string,
  pidFile: string,
  pid: number,
  pidFileExists: boolean,
  pidFileReadable: boolean,
  debug: boolean,
}
export class privateSettings implements IprivateSettings {
  adminPassword: string = "Descent3$";
  pidFile: string = "/var/www/html/pal_server/erver/pal_server.pid";
  pid: number = -1;
  pidFileExists: boolean = false;
  pidFileReadable: boolean = false;
  debug: boolean = false;
  public constructor() { }
}

// export interface ISettingsExtra {
//   getSettings(): ISettings; 
//   setSettings(newSettings: ISettings): void;
// }



