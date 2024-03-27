// "use strict";
import { injectable } from "inversify";
import "reflect-metadata";

export interface IRconSettings {
  host: string;
  port: number;
  pw: string;
}

export interface IPidSettings {
  file: string;
  pid: number;
  shouldIdle: boolean;
  shouldStop: boolean;
  period: number,
  periodList: number[];
}


interface IServerSettings {
  certPath: string;
  keyPath: string;
  ip: string;
  streamServerPort: number;
}

interface IGuiSettings {
  enabled: boolean;
  period: number;
  shouldPaint: boolean;
  shouldIdle: boolean;
  shouldStop: boolean;
  // refreshCounter: number;
  mode: string;
  min: number;
  max: number;
  values: any[];
  modeList: string[];
  periodList: number[];
  EOL: string;
}

interface IClientsSettings {
  shouldIdle: boolean;
  shouldStop: boolean;
  period: number,
  periodList: number[];
}

interface IReadOnlySettings {
  getSetting<T>(section: string, key: string): T | undefined;
}

@injectable()
export class settingsWrapper implements IReadOnlySettings {
  [key: string]: any;
  rcon: IRconSettings = {
    host: "192.168.228.7",
    port: 9998,
    pw: "Descent3$",
  };
  pid: IPidSettings = {
    file: "/var/www/html/pal_server/server/pal_server.pid",
    pid: -1,
    shouldStop: false,
    shouldIdle: false,
    period: 1000,
    periodList: [100, 250, 500, 1000, 2000, 5000],
  };
  server: IServerSettings = {
    certPath: '/etc/letsencrypt/live/neo.dnsfor.me/cert.pem',
    keyPath: '/etc/letsencrypt/live/neo.dnsfor.me/privkey.pem',
    ip: "0.0.0.0",
    streamServerPort: 8080,
  };
  gui: IGuiSettings = {
    enabled: true,
    period: 500,
    // refreshCounter: 0,
    shouldPaint: true,
    shouldIdle: false,
    shouldStop: false,
    mode: 'default',
    min: 0,
    max: 100,
    values: [],
    modeList: ['mode1', 'mode2', 'mode3'],
    periodList: [100, 250, 500, 1000, 2000, 5000],
    EOL: '\n',
  };
  clients: IClientsSettings = {
    shouldIdle: false,
    shouldStop: true,
    period: 1000,
    periodList: [100, 250, 500, 1000, 2000, 5000],
  };
  public getSetting<T>(section: string, key: string): T | undefined {
    const settingsSection = this[section]; // Access the appropriate section object
    if (settingsSection && key in settingsSection) {
      return settingsSection[key] as T; // Cast to the expected type
    }
    return undefined;
  }
  constructor() { }
}

export const SettingsWrapperSymbol = Symbol('settingsWrapper'); 