// "use strict";
import { injectable, Container } from "inversify";
import "reflect-metadata";

export interface IRconSettings {
  host: string;
  port: number;
  pw: string;
  isConnected: boolean;
}

export interface IPidSettings {
  file: string;
  pid: number | "NaN";
  fileExists: boolean;
  fileReadable: boolean;
  processFound: boolean;
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
  isPainting: boolean;
  mode: string;
  min: number;
  max: number;
  values: any[];
  lastErrors: string[];
  modeList: string[];
  periodList: number[];
  EOL: string;
}

@injectable()
export class settingsWrapper {
  rcon: IRconSettings = {
    host: "192.168.228.7",
    port: 9998,
    pw: "Descent3$",
    isConnected: false,
  };
  pid: IPidSettings = {
    file: "/var/www/html/pal_server/server/pal_server.pid",
    pid: "NaN",
    fileExists: false,
    fileReadable: false,
    processFound: false,
  };
  server: IServerSettings = {
    certPath: '/etc/letsencrypt/live/neo.dnsfor.me/cert.pem',
    keyPath: '/etc/letsencrypt/live/neo.dnsfor.me/privkey.pem',
    ip: "0.0.0.0",
    streamServerPort: 8080,
  };
  gui: IGuiSettings = {
    enabled: true,
    period: 5000,
    isPainting: true,
    mode: 'default',
    min: 0,
    max: 100,
    values: [],
    lastErrors: [],
    modeList: ['mode1', 'mode2', 'mode3'],
    periodList: [100, 250, 500, 1000, 2000, 5000, 10000],
    EOL: '\n',
  };
  constructor() { }
}
export const SettingsWrapperSymbol = Symbol('settingsWrapper'); 