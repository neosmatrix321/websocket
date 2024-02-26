"use strict";
import "reflect-metadata";


import { optional, inject, injectable } from "inversify";

export interface ISettings {
  adminPassword: string,
  pidFile: string,
  pid: number,
  pidFileExists: boolean,
  pidFileReadable: boolean,
  debug: boolean,
  certPath: string,
  keyPath: string,
  ip: string,
  rconPort: number,
  streamServerPort: number
}
export interface IprivateSettings {
  getSettings(): ISettings; 
  setSettings(newSettings: ISettings): void;
}
@injectable()
export class privateSettings implements IprivateSettings {
  private _settings: ISettings;
  public constructor(@inject(PRIVATE_SETTINGS_TOKEN) @optional() settings: ISettings) {
    this._settings = settings ?? {
      adminPassword: "Descent3$",
      pidFile: "/var/www/html/pal_server/erver/pal_server.pid",
      pid: null,
      pidFileExists: false,
      pidFileReadable: false,
      debug: false,
      certPath: '/etc/letsencrypt/live/neo.dnsfor.me/cert.pem',
      keyPath: '/etc/letsencrypt/live/neo.dnsfor.me/privkey.pem',
      ip: "192.168.228.7",
      rconPort: 25575,
      streamServerPort: 8080
    };
  }
  public getSettings(): ISettings {
    return this._settings;
  }

  public setSettings(newSettings: ISettings): void {
    // ... optional validation logic ...
    this._settings = newSettings;
  }}

export const PRIVATE_SETTINGS_TOKEN = Symbol('privateSettings');
