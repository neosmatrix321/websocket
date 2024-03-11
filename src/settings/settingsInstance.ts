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
  adminPassword: string;
  pidFile: string;
  pid: number;
  pidFileExists: boolean;
  pidFileReadable: boolean;
  debug: boolean;
  public constructor(
    adminPassword?: string, pidFile?: string, pid?: number, pidFileExists?: boolean, pidFileReadable?: boolean, debug?: boolean
  ) {
    this.adminPassword = adminPassword || "Descent3$",
    this.pidFile = pidFile || "/var/www/html/pal_server/erver/pal_server.pid",
    this.pid = pid || -1,
    this.pidFileExists = pidFileExists || false,
    this.pidFileReadable = pidFileReadable || false,
    this.debug = debug || false
  }
}

// export interface ISettingsExtra {
//   getSettings(): ISettings; 
//   setSettings(newSettings: ISettings): void;
// }



