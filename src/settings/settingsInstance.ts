"use strict";
import "reflect-metadata";

export interface IprivateSettings {
  adminPassword: string,
  pidFile: string,
  pid: number | undefined,
  pidFileExists: boolean,
  pidFileReadable: boolean,
  debug: boolean,
}
export class privateSettings implements IprivateSettings {
  adminPassword: string = "Descent3$";
  pidFile: string = "/var/www/html/pal_server/server/pal_server.pid";
  pid: number | undefined = undefined;
  pidFileExists: boolean = false;
  pidFileReadable: boolean = false;
  debug: boolean = false;
  public constructor() { }
}

// export interface ISettingsExtra {
//   getSettings(): ISettings; 
//   setSettings(newSettings: ISettings): void;
// }



