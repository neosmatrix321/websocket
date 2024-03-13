// "use strict";
// import "reflect-metadata";
// import { inject, injectable } from "inversify";

// export interface ISettings {
//   settings: IprivateSettings;
// }

// @injectable()
// export class Settings implements ISettings {
//   settings: IprivateSettings;
//   constructor(@inject(PRIVATE_SETTINGS_TOKEN) settingsInstance: IprivateSettings) {
//     this.settings = settingsInstance;
//   }

//   public getSettings(): IprivateSettings {
//     return this.settings;
//   }

//   public setSettings(newSettings: IprivateSettings): void {
//     // ... optional validation logic ...
//     this.settings = newSettings;
//   }
// }

// export const PRIVATE_SETTINGS_TOKEN = Symbol('Settings');