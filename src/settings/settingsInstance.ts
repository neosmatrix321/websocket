"use strict";
import "reflect-metadata";


import { optional, inject, injectable, Container } from "inversify";

export interface ISettings {
  adminPassword: string,
  pidFile: string,
  pid: number,
  pidFileExists: boolean,
  pidFileReadable: boolean,
  debug: boolean,
}
export interface IprivateSettings {
  getSettings(): ISettings; 
  setSettings(newSettings: ISettings): void;
}
@injectable()
export default class privateSettings implements IprivateSettings {
  private _settings: ISettings;
  public constructor(@inject(PRIVATE_SETTINGS_TOKEN) @optional() settings: ISettings) {
    this._settings = settings ?? {
      adminPassword: "Descent3$",
      pidFile: "/var/www/html/pal_server/erver/pal_server.pid",
      pid: null,
      pidFileExists: false,
      pidFileReadable: false,
      debug: false,
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

