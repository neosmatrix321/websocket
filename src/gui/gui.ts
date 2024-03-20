
"use strict";
import { Container, inject, injectable } from 'inversify';
import "reflect-metadata";

import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IErrorEvent, IEventTypes, INewErr, MainEventTypes, SubEventTypes } from '../global/eventInterface';
import { SettingsWrapperSymbol, settingsWrapper } from '../settings/settingsInstance';
import { StatsWrapperSymbol, statsWrapper } from "../stats/statsInstance";
// Import module with ES6 syntax
import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ButtonPopup, ConfirmPopup, FileSelectorPopup, CustomPopup, InPageWidgetBuilder, SimplifiedStyledElement, Box, KeyListenerArgs } from 'console-gui-tools'
import { settingsContainer, statsContainer } from '../global/containerWrapper';
import { RGB } from 'console-gui-tools/dist/types/components/Utils';
import { ErrorTable } from './errorGen';
import { bufferCount } from 'rxjs';
import { clear } from 'pidusage';

export interface ColorRow {
  text: string;
  color: RGB;
  bold?: boolean;
}

export function columnWrapper(text: string, color: RGB = getRGBString('default')): SimplifiedStyledElement {
  return { text: text, color: color, bold: true };
}

export function getRGBString(colorName: string): RGB {
  const color = COLORS[colorName] || COLORS.default; // Falls 'colorName' nicht existiert, verwende den Default.
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

const COLORS: Record<string, number[]> =
{
  "default": [245, 245, 245],
  "black": [0, 0, 0],
  "blackBright": [29, 29, 29],
  "blue": [0, 0, 255],
  "blueBright": [70, 130, 180],
  "cyan": [0, 255, 255],
  "cyanBright": [224, 255, 255],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenBright": [144, 238, 144],
  "yellow": [255, 255, 0],
  "yellowBright": [255, 255, 224],
  "magenta": [255, 0, 255],
  "magentaBright": [255, 0, 255],
  "red": [255, 0, 0],
  "redBright": [255, 69, 0],
  "white": [235, 235, 235],
  "whiteBright": [255, 255, 255],
}


function createRow(...columns: string[]): string {
  return columns.map(column => {
    if (column) {
      const parts = column.split(':');
      const key = parts[0];
      const value = parts.length > 1 ? parts[1] : '';
      const totalPadding = Math.max(0, 18 - key.length - value.length);
      return `${key}:${' '.repeat(totalPadding)}${value}`;
    }
    return '';
  }).join(' | ');
}

function createTwoRow(obj: any, p: InPageWidgetBuilder): void {
  switch (typeof obj) {
    case 'object':
      obj.forEach((value: string, key: string) => {
        if (key && value) {
          const totalPadding1 = ' '.repeat(Math.max(0, 30 - key.length - value.length));
          const newValue1: SimplifiedStyledElement = columnWrapper(key, getRGBString(value));
          const middle: SimplifiedStyledElement = columnWrapper(totalPadding1);
          const newValue2: SimplifiedStyledElement = columnWrapper(key, getRGBString(value));
          p.addRow(
            {
              ...newValue1,
              ...middle,
              ...newValue2
            });
        }
      });
      break;
    default:
      console.warn(`createTwoRow: unknown type: ${typeof obj}`);
    // this.eV.handleError(SubEventTypes.ERROR.WARNING, "createTwoRow", new CustomErrorEvent(`from ${obj}`, MainEventTypes.MAIN, obj));
  }
}
function printAvailableColors(p: InPageWidgetBuilder): void {
  p.addRow({ text: "Available Colors:", color: `yellow` });
  p.addSpacer();
  // for (let i = 0; i < COLORS.length; i += 1) {
  createTwoRow(COLORS, p);
  // }

}

@injectable()
export class consoleGui {
  protected eV: EventEmitterMixin = mixin;
  protected settings: settingsWrapper = settingsContainer;
  protected stats: statsWrapper = statsContainer;
  protected gui: ConsoleManager;
  protected widget: any = { stdLog: undefined };
  protected errorLog: ErrorTable;
  private guiIntVat: NodeJS.Timeout;
  constructor() {
    this.gui = new ConsoleManager({
      title: 'Websocket Server', // Title of the console
      logPageSize: 20, // Number of lines to show in logs page
      logLocation: 'popup', // Location of the logs page (top or bottom)
      enableMouse: true, // Enable mouse support
      showLogKey: 'ctrl+0', // Show logs with ctrl+l
      overrideConsole: true, // Override console.log, console.error, console.warn
      layoutOptions: {
        pageRatio: [[0.25, 0.75], [0.7, 0.3]], // Set the ratio of the top and bottom pages
        changeFocusKey: 'tab', // Change focus with tab
        boxed: true, // Set to true to enable boxed layout mode
        boxColor: 'blackBright', // The color of the box
        boxStyle: undefined, // The style of the box (bold)
        type: 'quad', // Layout type
        // direction: 'horizontal', // Layout direction
        fitHeight: true, // Fit height of the console
      },
    });
    this.guiIntVat = setInterval(async () => {
    }, 1000);
    clearInterval(this.guiIntVat);

    this.errorLog = new ErrorTable(this.gui.Screen.width, this.gui.Screen.height); // Use the width of your 'ErrorLog' Box
  }
  public startIfTTY() {
    if (!this.gui.Screen.Terminal.isTTY) return console.info('No TTY detected, skipping console-gui-tools');
    this.drawGUI();
    this.guiIntVat = setInterval(async () => {
      this.intervalRunner();
    }, this.settings.gui.period);
    this.settings.gui.isPainting = true;
    this.setupEventListeners();
        // this.gui.showLogPopup();
  }
  intervalRunner() {
    this.settings.gui.refreshCounter += 1;
    this.drawGUI();
  }
  private setupEventListeners() {
    this.eV.on(MainEventTypes.GUI, (event: IErrorEvent) => {
      EventEmitterMixin.eventStats.guiActiveEvents += 1;
      EventEmitterMixin.eventStats.activeEvents += 1;
      switch (event.subType) {
        case SubEventTypes.GUI.PRINT_DEBUG:
          this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `GUI` });
          // console.log("Clients:");
          // console.dir(this.clients, { depth: 3, colors: true });
          break;
        case SubEventTypes.GUI.FILL_ERROR_ARRAY:
          const error: INewErr = event.message as unknown as INewErr;
          this.errorLog.lastErrors.push(error);
          console.error(`Error No. ${error.counter} added to errorLog: ${error.subType}`);
          break;
      }
    });
    this.gui.on("exit", () => {
      this.closeApp();
    });
    this.gui.on("resize", () => {
      this.errorLog.box.hide();
      this.drawGUI();
    });
    // this.gui.Screen.update();
    // And manage the keypress event from the library
    this.gui.on("keypressed", (key: KeyListenerArgs) => {
      // console.info(`GUI keypress: ${key.name}`);
      EventEmitterMixin.eventStats.guiEventCounter += 1;
      switch (key.name) {
        case "o": {
          if (!this.gui.popupCollection["logPopup"]) {
            this.gui.showLogPopup();
            // this.gui.registerPopup("logPopup");
            // this.gui.popupCollection.pop("logPopup");
          }
          //  else {
          //   console.info(`unregisterPopup`);
          //   this.gui.unregisterPopup("logPopup");
          // }
          // this.eV.handleError(SubEventTypes.ERROR.WARNING, "showLogPopup", MainEventTypes.GUI, new Error(`from ErrorLog`), this.gui.popupCollection["logPopup"]);
          // if (!this.gui.popupCollection.includes("showLogPopup")) {
          //   const key = this.gui.popupCollection.unregisterPopup();
          //   console.log(`Unregistered popup: ${key}`);
          // } else {
          // console.log(`Unregistered popup:`, key.name);
          // this.eV.handleError(SubEventTypes.ERROR.WARNING, "showLogPopup", MainEventTypes.GUI, new Error(`from ErrorLog`), index);
          // this.gui.popupCollection.push("logPopup");
          break;
        }
        case "space": {
          if (this.settings.gui.isPainting) {
            this.settings.gui.isPainting = false;
            clearInterval(this.guiIntVat);
          } else {
            this.settings.gui.isPainting = true;
            this.guiIntVat = setInterval(async () => {
              this.intervalRunner();
            }, this.settings.gui.period);
          }
          this.drawGUI();
          break;
        }
        case "s": {
          new OptionPopup({
            id: "popupSelectMode",
            title: "Select simulation mode",
            options: this.settings.gui.modeList,
            selected: this.settings.gui.mode
          }).show().on("confirm", (_mode) => {
            this.settings.gui.mode = _mode
            this.gui.warn(`NEW MODE: ${this.settings.gui.mode}`)
            this.drawGUI()
          })
          break
        }
        case "r": {
          new OptionPopup({
            id: "popupSelectPeriod",
            title: "Select simulation period",
            options: this.settings.gui.periodList,
            selected: this.settings.gui.period
          }).show().on("confirm", (_period) => {
            const msgMultiLine = `Changing period from ${this.settings.gui.period} to ${_period} ms.${this.settings.gui.EOL}This will restart the simulator.${this.settings.gui.EOL}Do you want to continue?`;
            new ButtonPopup({
              id: "popupConfirmPeriod",
              title: "Confirm period",
              message: msgMultiLine,
              buttons: ["Yes", "No", "?"]
            }).show().on("confirm", (answer) => {
              if (answer === "Yes") {
                this.settings.gui.period = _period;
                clearInterval(this.guiIntVat);
                this.gui.warn(`NEW PERIOD: ${this.settings.gui.period}`)
                this.guiIntVat = setInterval(async () => {
                  this.drawGUI();
                }, this.settings.gui.period);
                this.settings.gui.isPainting = true;
              } else if (answer === "?") {
                this.gui.info("Choose ok to confirm period");
              }
              this.drawGUI();
            });
          });
          break;
        }
        case ".": {
          new InputPopup({
            id: "popupTypeMax",
            title: "Type max value",
            value: this.settings.gui.max,
            numeric: true
          }).show().on("confirm", (_max) => {
            this.settings.gui.max = _max;
            this.gui.warn(`NEW MAX VALUE: ${this.settings.gui.max}`);
            this.drawGUI();
          });
          break;
        }
        case ",": {
          new InputPopup({
            id: "popupTypeMin",
            title: "Type min value",
            value: this.settings.gui.min,
            numeric: true
          }).show().on("confirm", (_min) => {
            this.settings.gui.min = _min;
            console.info(`NEW MIN VALUE: ${this.settings.gui.min}`);
            this.drawGUI();
          });
          break;
        }
        case "f2": {
          const p = new InPageWidgetBuilder(20);
          printAvailableColors(p);
          new Box({
            id: "colorDisplay",
            x: 10,
            y: 2,
            width: 80,
            height: 25,
            draggable: true,
            style: {
              boxed: true,
            }
          }).setContent(p).show();
          break;
        }
        case "f1": {
          const p = new PageBuilder(15); // Add a scroll limit so it will be scrollable with up and down     this.addAliveStatus(p1);
          const deWhite = this.D('white', 'bgBlack');
          const deYellow = this.D('yellow', 'bgBlack', true);
          const minus = this.M('white', 'bgBlack');
          p.addRow({ text: "           " }, deYellow, deYellow, deYellow, { text: "  Commands  ", color: 'yellow', bg: 'bgBlack', bold: true, underline: true }, deYellow, deYellow, deYellow);
          p.addSpacer();
          p.addRow({ text: `        Start/stop `, color: 'white' }, minus, { text: ` 'space' `, color: 'white' }, deWhite, this.sOBJ(), this.Alive());
          p.addRow({ text: `   Simulation mode `, color: 'white' }, minus, { text: ` 'm'     `, color: 'white' }, deWhite, { text: ` ${this.settings.gui.mode}`, color: 'cyan' });
          p.addRow({ text: `    refresh widget `, color: 'white' }, minus, { text: ` 's'     `, color: 'white' }, deWhite, { text: ` ${this.settings.gui.period} ms`, color: "cyan" });
          p.addRow({ text: `     Set max value `, color: 'white' }, minus, { text: ` 'h'     `, color: 'white' }, deWhite, { text: ` ${this.settings.gui.max}`, color: 'cyan' });
          p.addRow({ text: `     Set min value `, color: 'white' }, minus, { text: ` 'l'     `, color: 'white' }, deWhite, { text: ` ${this.settings.gui.min}`, color: 'cyan' });
          p.addSpacer();
          p.addRow({ text: `              Quit `, color: 'white', bold: true }, minus, { text: ` 'q'     `, color: 'white' });
          p.addSpacer();
          p.addRow({ text: `   Values: `, color: 'cyan' }, { text: ` ${this.settings.gui.values.map(v => v.toFixed(4)).join(' - ')}`, color: 'blueBright', bold: true });
          new CustomPopup({
            id: "popupHelp",
            title: "HELP",
            content: p,
            width: 35
          }).show();
          break;
        }
        case "p": {
          this.errorLog.displayErrorLog();
          break;
        }
      }
    });
    
  }


  // Funktion zur Ermittlung der Farbe für Log-Level
  private M(color: string, bg: string, bold: boolean = true, italic: boolean = false): any {
    return { text: `-`, color: color, bg: bg, bold: bold, italic: italic };
  }

  private D(color: string, bg: string, underline: boolean = false, bold: boolean = false): any {
    return { text: `#`, color: color, bg: bg, underline: underline, bold: bold };
  }

  private Alive(): any {
    if (!this.settings.gui.isPainting) {
      return { text: `false`, color: 'red', bg: 'bgBlack', bold: true };
    } else {
      return { text: `true`, color: 'white', bg: 'bgBlack', bold: true };
    }
  }

  private sSTR(spaceCount: number = 1): string {
    return ' '.repeat(spaceCount);
  }
  private sOBJ(spaceCount: number = 1) {
    return { text: ' '.repeat(spaceCount) }
  };

  async updateConsole(): Promise<void> {
    const deWhite = this.D('white', 'bgBlack');
    const deYellow = this.D('yellow', 'bgBlack', true, true);
    const minus = this.M('white', 'bgBlack');
    const p1 = new PageBuilder();
    const p2 = new PageBuilder();
    const p3 = new PageBuilder();
    const p4 = new PageBuilder();
    p1.addRow(this.sOBJ(2), deYellow, deYellow, deYellow, { text: ` Global Stats `, color: 'yellow', underline: true, bold: true }, deYellow, deYellow, deYellow,);
    p1.addSpacer();
    p2.addRow(this.sOBJ(6), deYellow, deYellow, deYellow, { text: ` Process Stats `, color: 'yellow', underline: true, bold: true }, deYellow, deYellow, deYellow,);
    p2.addSpacer();
    p3.addRow(this.sOBJ(6), deYellow, deYellow, deYellow, { text: ` Error Log `, color: 'yellow', underline: true, bold: true }, deYellow, deYellow, deYellow,);
    p3.addSpacer();
    p4.addRow(this.sOBJ(4), deYellow, deYellow, deYellow, { text: ` Widget Stats `, color: 'yellow', underline: true, bold: true }, deYellow, deYellow, deYellow,);
    p4.addSpacer();


    // Global Stats
    p1.addRow(this.sOBJ(11), { text: `alive:`, color: 'white' }, this.sOBJ(1), this.Alive());
    p1.addRow(this.sOBJ(1), { text: `refresh counter:`, color: 'white' }, this.sOBJ(1), { text: `${this.settings.gui.refreshCounter}`, color: 'white' });
    p1.addRow(this.sOBJ(2), { text: `client counter:`, color: 'white' }, this.sOBJ(1), { text: `${this.stats.client.clientsCounter}`, color: 'white' });
    p1.addRow(this.sOBJ(2), { text: `clients active:`, color: 'white' }, this.sOBJ(1), { text: `${this.stats.client.activeClients}`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `active events:`, color: 'white' }, this.sOBJ(1), { text: `${EventEmitterMixin.eventStats.activeEvents}`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `event counter:`, color: 'white' }, this.sOBJ(1), { text: `${EventEmitterMixin.eventStats.eventCounter}`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `active GUI E:`, color: 'white' }, this.sOBJ(1), { text: `${EventEmitterMixin.eventStats.guiActiveEvents}`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `event GUI C:`, color: 'white' }, this.sOBJ(1), { text: `${EventEmitterMixin.eventStats.guiEventCounter}`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `messages sent:`, color: 'whiteBright', bg: 'bgBlackBright', bold: true }, this.sOBJ(1), { text: `dummy`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `error counter:`, color: 'whiteBright', bg: 'bgRed', bold: true }, this.sOBJ(1), { text: `${EventEmitterMixin.eventStats.errorCounter}`, color: 'white' });
    p1.addRow(this.sOBJ(3), { text: `captured error:`, color: 'whiteBright', bg: 'bgRed', bold: true }, this.sOBJ(1), { text: `${this.errorLog.lastErrors.length}`, color: 'white' });

    p1.addSpacer();

    // for (const [key, value] of Object.entries(this.stats.global.lastUpdates)) { // TODO: popup with all last updates
    //   p2.addRow(this.S(2), { text: `${key}:`, color: 'white' }, { text: ` ${value}`, color: 'white' });
    // }
    // p2.addRow(this.S(2), { text: `server version:`, color: 'white' }, { text: ` ${this.stats.global.serverVersion}`, color: 'white' });
    // p2.addRow(this.S(2), { text: `server uptime:`, color: 'white' }, { text: ` ${this.stats.global.pu.elapsed}`, color: 'white' });

    const elapsedDur: string = this.calcDurationDetailed(this.stats.global.pu.elapsed as number) || "NaN";
    const ctimeDur: string = this.calcDurationDetailed(this.stats.global.pu.ctime as number) || "NaN";

    p2.addRow(this.sOBJ(5), columnWrapper(`address:`), columnWrapper(`${this.sSTR(1)}${this.settings.rcon.host}:${this.settings.server.streamServerPort}`));
    p2.addRow(this.sOBJ(1), columnWrapper(createRow(
      `exists:${this.settings.pid.fileExists}`,
      `upTime:${elapsedDur}`,
      `web alive:${this.stats.server.webHandle.isAlive}`
    )));
    p2.addRow(this.sOBJ(1), columnWrapper(createRow(
      `readable:${this.settings.pid.fileReadable}`,
      `cTime:${ctimeDur}`,
      `has conn:${this.stats.server.webHandle.hasConnection}`
    )));
    const dur: number = Math.floor(Date.now() - this.stats.global.intvalStats.idleStart);
    const duration: string = this.calcDurationDetailed(dur) || "NaN";
    p2.addRow(this.sOBJ(1), columnWrapper(createRow(
      `pid:${this.settings.pid.pid}`,
      `cpu:${this.stats.global.pu.cpu}%`,
      `IDLE time:${duration}`
    )));

    p2.addRow(this.sOBJ(1), columnWrapper(createRow(
      `SI pid:${this.stats.global.si.pid}`,
      `SI Mem:${this.stats.global.si.mem}`,
      `IDLE start:${Math.floor(this.stats.global.intvalStats.idleStart / 1000).toFixed(0)}`
    )));
    p2.addRow(this.sOBJ(1), columnWrapper(createRow(
      `PU pid:${this.stats.global.pu.pid}`,
      `PU Mem:${this.stats.global.pu.memory}`,
      `IDLE end:${Math.floor(this.stats.global.intvalStats.idleEnd / 1000).toFixed(0)}`
    )));
    p2.addRow(this.sOBJ(1), columnWrapper(createRow(
      `found:${this.settings.pid.processFound}`,
      `moin:dummy`,
      `6:3`
    )));

    // Widget Stats

    const selfStats = this.getSelfStats();
    p4.addRow(this.sOBJ(2), { text: `uptime:`, color: 'white' }, { text: ` ${selfStats.uptime}`, color: 'white' });
    const cpu = Math.floor(selfStats.cpuUsage as unknown as number / 8);
    p4.addRow(this.sOBJ(2), { text: `cpu :`, color: 'white' }, { text: ` ${cpu}%`, color: 'white' });
    p4.addRow(this.sOBJ(2), { text: `memory usage:`, color: 'white' }, { text: ` ${selfStats.memoryUsage} MB`, color: 'white' });
    p4.addRow(this.sOBJ(2), { text: `heap memory usage:`, color: 'white' }, { text: ` ${selfStats.memoryUsageHeap} MB`, color: 'white' });
    p4.addRow(this.sOBJ(2), { text: `total heap memory:`, color: 'white' }, { text: ` ${selfStats.memoryUsageHeapTotal} MB`, color: 'white' });
    p4.addSpacer(3);
    p4.addRow(this.sOBJ(4), { text: "press 'f1' for HELP!", color: 'white', bg: 'bgBlackBright', overline: true });

    this.gui.setPage(p1, 0);
    this.gui.setPage(p2, 1);
    this.gui.setPage(p3, 2);
    this.gui.setPage(p4, 3);
    // this.gui.setPages([p1, p2, p3, p4], ["Top Left", "Top Right", "Bottom Left", "Bottom Right"]);
  }

  private calcDuration(timestamp: number): string {
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = Math.floor(timestamp % 60);
    return `${hours}:${minutes}:${seconds}`;
  }

  private calcDurationDetailed(duration: number): string {
    // console.info(`duration: ${duration}`);
    if (isNaN(duration) || !(duration > 1)) {
      return "NaN";
    }
    const milliseconds = Math.floor((duration % 1) * 1000);
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));

    let durationSTR = '';
    if (days > 0) {
      durationSTR += `${days}d `;
    }
    if (hours > 0) {
      durationSTR += `${hours}h `;
    }
    if (minutes > 0) {
      durationSTR += `${minutes}m `;
    }
    if (seconds > 0) {
      durationSTR += `${seconds}s `;
    }
    if (milliseconds > 0) {
      durationSTR += `${milliseconds}ms`;
    }
    return durationSTR.trim();
  }
  private getSelfStats() {
    const uptime = process.uptime();
    const uptimeText = this.calcDuration(uptime);
    const ownCPU = process.cpuUsage();
    const cpuUsage = (ownCPU.user + ownCPU.system) / 1000000;
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.rss / 1024 / 1024;
    const memoryUsageHeapMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryUsageHeapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    return {
      uptime: uptimeText,
      cpuUsage: cpuUsage.toFixed(2),
      memoryUsage: memoryUsageMB.toFixed(2),
      memoryUsageHeap: memoryUsageHeapMB.toFixed(2),
      memoryUsageHeapTotal: memoryUsageHeapTotalMB.toFixed(2)
    }
  }

  private closeApp() {
    // Add your closing logic here
    console.clear();
    process.exit(0);
  }
  public async drawGUI(): Promise<void> {
    this.updateConsole();
    this.gui.refresh();
    // ... rest of your drawGUI logic
  }
}
