"use strict";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import * as settingsI from "./settingsInstance";

export interface ISettings {
  settings: settingsI.IprivateSettings;
}

@injectable()
export class Settings implements ISettings {
  settings: settingsI.IprivateSettings;
  constructor(@inject(PRIVATE_SETTINGS_TOKEN) settings: settingsI.IprivateSettings) {
    this.settings = settings;
  }

  public getSettings(): settingsI.IprivateSettings {
    return this.settings;
  }

  public setSettings(newSettings: settingsI.IprivateSettings): void {
    // ... optional validation logic ...
    this.settings = newSettings;
  }
}

export const PRIVATE_SETTINGS_TOKEN = Symbol('privateSettings');