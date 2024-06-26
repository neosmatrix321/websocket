
"use strict";
import { injectable } from 'inversify';
import "reflect-metadata";

import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IBaseEvent, IGuiEvent, INewErr, MainEventTypes, SubEventTypes } from '../global/eventInterface';
import { settingsWrapper } from '../settings/settingsInstance';
import { statsWrapper } from '../global/statsInstance';
// Import module with ES6 syntax
import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ButtonPopup, CustomPopup, InPageWidgetBuilder, Box, KeyListenerArgs } from 'console-gui-tools'
import { settingsContainer, statsContainer } from '../global/containerWrapper';
import { ErrorTable } from './errorGen';
import { displayLastUpdates } from './displayLastUpdates';
import { displayGlobalStats } from './displayGlobalStats';
import { D, M, sOBJ, printAliveStatus } from '../global/functions';
// import { displayLastUpdates } from './displayLastUpdates';


// function createTwoRow(obj: any, p: InPageWidgetBuilder): void {
//   switch (typeof obj) {
//     case 'object':
//       obj.forEach((value: string, key: string) => {
//         if (key && value) {
//           const totalPadding1 = ' '.repeat(Math.max(0, 30 - key.length - value.length));
//           const newValue1: SimplifiedStyledElement = columnWrapperText(key, getRGBString(value));
//           const middle: SimplifiedStyledElement = columnWrapperText(totalPadding1);
//           const newValue2: SimplifiedStyledElement = columnWrapperText(key, getRGBString(value));
//           p.addRow(
//             {
//               ...newValue1,
//               ...middle,
//               ...newValue2
//             });
//         }
//       });
//       break;
//     default:
//       console.warn(`createTwoRow: unknown type: ${typeof obj}`);
//     // this.eV.handleError(SubEventTypes.ERROR.WARNING, "createTwoRow", new CustomErrorEvent(`from ${obj}`, MainEventTypes.MAIN, obj));
//   }
// }

// function printAvailableColors(p: InPageWidgetBuilder): void {
//   p.addRow({ text: "Available Colors:", color: `yellow` });
//   p.addSpacer();
//   // for (let i = 0; i < COLORS.length; i += 1) {
//   createTwoRow(COLORS, p);
//   // }

// }

@injectable()
export class consoleGui {
  protected eV: EventEmitterMixin = mixin;
  protected settings: settingsWrapper = settingsContainer;
  protected stats: statsWrapper = statsContainer;
  protected gui: ConsoleManager;
  protected widget: any = { stdLog: undefined };
  protected globalStats: displayGlobalStats;
  protected lastUpdates: displayLastUpdates;
  protected errorLog: ErrorTable;
  protected footer: Box;
  private guiIntVat: NodeJS.Timeout;
  constructor() {
    // super();
    this.stats.updateLastUpdates("gui", "start");
    this.gui = new ConsoleManager({
      title: 'WebsocketServer', // Title of the console
      logPageSize: 100, // Number of lines to show in logs page
      logLocation: 'popup', // Location of the logs page (top or bottom)
      enableMouse: true, // Enable mouse support
      showLogKey: 'ctrl+0', // Show logs with ctrl+l
      overrideConsole: true, // Override console.log, console.error, console.warn
      layoutOptions: {
        showTitle: true, // Show the title
        // pageRatio: [[0.30, 0.70], [0.5, 0.5]], // Set the ratio of the top and bottom pages
        changeFocusKey: 'tab', // Change focus with tab
        boxed: true, // Set to true to enable boxed layout mode
        boxColor: 'yellow', // The color of the box
        boxStyle: 'bold', // The style of the box (bold)
        type: 'single', // Layout type
        // direction: 'vertical', // Layout direction
        fitHeight: true, // Fit height of the console
      },
    });
    console.info(`GUI started: ${statsContainer.gui.selfStats.width}x${statsContainer.gui.selfStats.height}`);
    this.stats.gui.selfStats.width = statsContainer.gui.selfStats.width && statsContainer.gui.selfStats.width > 0 ? statsContainer.gui.selfStats.width : 110;
    this.stats.gui.selfStats.height = statsContainer.gui.selfStats.height && statsContainer.gui.selfStats.height > 0 ? statsContainer.gui.selfStats.height : 30;
    this.footer = new Box({
      id: "footer",
      x: 2,
      y: this.stats.gui.selfStats.height - 1,
      width: this.gui.Screen.width - 4,
      height: 1,
    });
    this.guiIntVat = setInterval(async () => {
    }, 1000);
    clearInterval(this.guiIntVat);
    // TODO: IF GUI smaller then 100 x 15 display dummy screen
    this.footer.show();
    this.globalStats = new displayGlobalStats(this.gui);
    this.lastUpdates = new displayLastUpdates();
    this.errorLog = new ErrorTable(); // Use the width of your 'ErrorLog' Box
    this.gui.refresh();
  }
  public startIfTTY() {
    if (!this.gui.Screen.Terminal.isTTY) return console.info('No TTY detected, skipping console-gui-tools');
    this.setupEventListeners();
    this.drawGUI();
    this.printFooter();
    
    this.guiIntVat = setInterval(async () => {
      this.intervalRunner();
    }, this.settings.gui.period);
    this.stats.gui.selfStats.isPainting = true;
    this.stats.updateLastUpdates("gui", "start", true);
    if (!this.settings.gui.shouldPaint) this.toggleStopMode();
    // this.gui.showLogPopup();
  }

  intervalRunner() {
    // this.settings.gui.refreshCounter += 1;
    this.drawGUI();
  }

  private toggleStopMode() {
    if (!this.settings.gui.shouldStop) {
      this.settings.gui.shouldStop = true;
      this.stats.gui.selfStats.isPainting = false;
      clearInterval(this.guiIntVat);
    } else {
      this.settings.gui.shouldStop = false;
      this.stats.gui.selfStats.isPainting = true;
      this.guiIntVat = setInterval(async () => {
        this.intervalRunner();
      }, this.settings.gui.period);
    }
    this.globalStats.printGlobalStats();
    this.globalStats.drawConsole();
  }

  private setDefaults() {
    this.globalStats.statsWidgets.header.box.absoluteValues.x = this.globalStats.defaults.header.x;
    this.globalStats.statsWidgets.header.box.absoluteValues.y = this.globalStats.defaults.header.y;
    this.globalStats.statsWidgets.header.box.absoluteValues.width = this.globalStats.defaults.header.width;
    this.globalStats.statsWidgets.header.box.absoluteValues.height = this.globalStats.defaults.header.height;

    this.globalStats.statsWidgets.widget.box.absoluteValues.x = this.globalStats.defaults.widget.x;
    this.globalStats.statsWidgets.widget.box.absoluteValues.y = this.globalStats.defaults.widget.y;
    this.globalStats.statsWidgets.widget.box.absoluteValues.width = this.globalStats.defaults.widget.width;
    this.globalStats.statsWidgets.widget.box.absoluteValues.height = this.globalStats.defaults.widget.height;

    this.globalStats.statsWidgets.pid.box.absoluteValues.x = this.globalStats.defaults.pid.x;
    this.globalStats.statsWidgets.pid.box.absoluteValues.y = this.globalStats.defaults.pid.y;
    this.globalStats.statsWidgets.pid.box.absoluteValues.width = this.globalStats.defaults.pid.width;
    this.globalStats.statsWidgets.pid.box.absoluteValues.height = this.globalStats.defaults.pid.height;

    this.globalStats.statsWidgets.web.box.absoluteValues.x = this.globalStats.defaults.web.x;
    this.globalStats.statsWidgets.web.box.absoluteValues.y = this.globalStats.defaults.web.y;
    this.globalStats.statsWidgets.web.box.absoluteValues.width = this.globalStats.defaults.web.width;
    this.globalStats.statsWidgets.web.box.absoluteValues.height = this.globalStats.defaults.web.height;

    this.globalStats.statsWidgets.server.box.absoluteValues.x = this.globalStats.defaults.server.x;
    this.globalStats.statsWidgets.server.box.absoluteValues.y = this.globalStats.defaults.server.y;
    this.globalStats.statsWidgets.server.box.absoluteValues.width = this.globalStats.defaults.server.width;
    this.globalStats.statsWidgets.server.box.absoluteValues.height = this.globalStats.defaults.server.height;

    this.globalStats.statsWidgets.console.box.absoluteValues.x = this.globalStats.defaults.console.x;
    this.globalStats.statsWidgets.console.box.absoluteValues.y = this.globalStats.defaults.console.y;
    this.globalStats.statsWidgets.console.box.absoluteValues.width = this.globalStats.defaults.console.width;
    this.globalStats.statsWidgets.console.box.absoluteValues.height = this.globalStats.defaults.console.height;

    this.globalStats.statsWidgets.rcon.box.absoluteValues.x = this.globalStats.defaults.rcon.x;
    this.globalStats.statsWidgets.rcon.box.absoluteValues.y = this.globalStats.defaults.rcon.y;
    this.globalStats.statsWidgets.rcon.box.absoluteValues.width = this.globalStats.defaults.rcon.width;
    this.globalStats.statsWidgets.rcon.box.absoluteValues.height = this.globalStats.defaults.rcon.height;
  }




  private resizeDefaults(reset: boolean = false) {
    this.errorLog.errorLogBox.hide();
    this.gui.Screen.update();
    this.gui.refresh();
    this.stats.gui.selfStats.width = this.gui.Screen.width;
    this.stats.gui.selfStats.height = this.gui.Screen.height;
    this.globalStats.updateDefaults();
    // this.globalStats.statsWidgets.header.box.absoluteValues.width = this.gui.Screen.width - 7;
    if (reset) { // TODO: calculate defaults and set new on reset
      this.setDefaults();
    }
    this.globalStats.printGlobalStats();
    this.globalStats.drawConsole();
    
    this.printFooter();
    this.gui.refresh();
  }
  
  private setupEventListeners() {
    this.eV.on(MainEventTypes.GUI, (event: IGuiEvent) => {
      let subType = typeof event.subType === 'string' ? event.subType : 'no subtype';
      let message = typeof event.message === 'string' ? event.message : `no message | ${subType}`;
      let success = typeof event.success === 'boolean' ? event.success : false;
      let json = typeof event.json !== 'undefined' ? event.json : { "no": "json" };
  
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.GUI,
        success: success,
        message: message,
        json: json,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      switch (event.subType) {
        case SubEventTypes.GUI.PRINT_DEBUG:
          this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `GUI` });
          // console.log("Clients:");
          // console.dir(this.clients, { depth: 3, colors: true });
          break;
        case SubEventTypes.GUI.DRAW:
          this.drawGUI();
          break;
        case SubEventTypes.GUI.UPDATE_STATS:
          this.getSelfStats();
          // console.log("Clients:");
          // console.dir(this.clients, { depth: 3, colors: true });
          break;
        case SubEventTypes.GUI.IDLE_INTERVAL:
          this.toggleIdleMode(event.newStringValue);
          break;
        case SubEventTypes.GUI.CHANGE_INTERVAL:
          this.settings.gui.period = event.newNumberValue;
          this.changeInterval();
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
      this.resizeDefaults(true);
      // console.info(`GUI resized to: ${statsContainer.gui.selfStats.width}x${statsContainer.gui.selfStats.height}`);
    });
    // this.gui.Screen.update();
    // And manage the keypress event from the library
    this.gui.on("keypressed", (key: KeyListenerArgs) => {
      // console.info(`GUI keypress: ${key.name}`);
      EventEmitterMixin.eventStats.guiEventCounter += 1;
      switch (key.name) {
        case "o": {
          if (this.globalStats.consoleFUllscreenMode) {
            this.globalStats.consoleFUllscreenMode = false;
          } else {
            this.globalStats.consoleFUllscreenMode = true;
          }
          this.globalStats.drawConsole();
          this.gui.refresh();
          // this.drawGUI();
            // this.gui.popupCollection["logPopup"].content.absoluteValues.height = this.gui.Screen.height - 4;
            // this.eV.handleError(SubEventTypes.ERROR.INFO, "popupCollection", MainEventTypes.GUI, new Error(`popupCollection:`), this.gui.popupCollection["logPopup"]);
            // this.gui.setLogPageSize(100);
            // this.gui.Screen.Terminal. = this.gui.Screen.height - 4;
          break;
        }
        case "q": {
          this.closeApp();
          break;
        }
        case "space": {
          this.toggleStopMode();
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
            this.globalStats.printGlobalStats();
            this.globalStats.drawConsole();
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
                if (this.guiIntVat.hasRef()) this.guiIntVat.unref();
                this.settings.gui.period = _period;
                this.changeInterval();
                // this.guiIntVat.ref();
                this.gui.info(`NEW PERIOD: ${this.settings.gui.period}`)
                // this.guiIntVat.refresh();
                //  = setInterval(async () => {
                //             this.globalStats.printGlobalStats();
                this.globalStats.drawConsole();

                // }, this.settings.gui.period);
                // this.guiIntVat.
                // if (this.stats.gui.selfStats.isPainting) this.guiIntVat.refresh();
                // this.guiIntVat.ref();
              } else if (answer === "?") {
                this.gui.info("Choose ok to confirm period");
              }
              this.globalStats.printGlobalStats();
              this.globalStats.drawConsole();

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
            this.globalStats.printGlobalStats();
            this.globalStats.drawConsole();

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
            this.globalStats.printGlobalStats();
            this.globalStats.drawConsole();

          });
          break;
        }
        case "f5": {
          this.resizeDefaults();
          const statsEvent: IBaseEvent = { // TODO: promise ?
            subType: SubEventTypes.STATS.UPDATE_ALL,
            message: 'updateStats',
          };
          this.eV.emit(MainEventTypes.STATS, statsEvent);
          setTimeout(() => {
            this.resizeDefaults();
          }, 2000)
          this.resizeDefaults();
          break;
        }
        case "f12": {
          this.resizeDefaults(true);
          break;
        }
        // case "f8": { // TODO: colors ?
        //   const p = new InPageWidgetBuilder(20);
        //   printAvailableColors(p);
        //   new Box({
        //     id: "colorDisplay",
        //     x: 10,
        //     y: 2,
        //     width: 80,
        //     height: 25,
        //     draggable: true,
        //     style: {
        //       boxed: true,
        //     }
        //   }).setContent(p).show();
        //   break;
        // }
        case "f2": {
          this.toggleIdleMode();
          break;
        }
        case "f1": {
          const p = new PageBuilder(15); // Add a scroll limit so it will be scrollable with up and down     this.addAliveStatus(p1);
          const deWhite = D('white', 'bgBlack');
          const deYellow = D('yellow', 'bgBlack', true);
          const minus = M('white', 'bgBlack');
          p.addRow({ text: "           " }, deYellow, deYellow, deYellow, { text: "  Commands  ", color: 'yellow', bg: 'bgBlack', bold: true, underline: true }, deYellow, deYellow, deYellow);
          p.addSpacer();
          p.addRow({ text: `        Start/stop `, color: 'white' }, minus, { text: ` 'space' `, color: 'white' }, deWhite, sOBJ(), printAliveStatus(this.stats.gui.selfStats.isPainting));
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
        case "u": {
          this.lastUpdates.displayLastUpdates();
          break;
        }
      }
    });

  }

  private changeInterval() {
    clearInterval(this.guiIntVat);
    this.guiIntVat = setInterval(async () => {
      this.intervalRunner();
    }, this.settings.gui.period);
  }

  private toggleIdleMode(mode: string = 'toggle') {
    if ((mode == 'toggle' && this.settings.gui.shouldIdle) || mode == 'resume') {
      this.settings.gui.shouldIdle = false;
      this.settings.gui.shouldStop = false;
    } else if ((mode == 'toggle' && !this.settings.gui.shouldIdle) || mode == 'idle') {
      this.settings.gui.shouldIdle = true;
      this.settings.gui.shouldStop = false;
    }
    this.drawGUI();
  }

  // Funktion zur Ermittlung der Farbe für Log-Level
  private async printFooter() {
    const row = new InPageWidgetBuilder(1)

    row.addRow(
      { text: "F1: ", color: "white", bold: true },
      { text: "Help", color: "black", bg: "bgCyan", bold: false },
      { text: " f2: ", color: "white", bold: true },
      { text: "IDLE", color: "black", bg: "bgCyan", bold: false },
      { text: " F5: ", color: "white", bold: true },
      { text: "Refresh", color: "black", bg: "bgCyan", bold: false },
      { text: " F12: ", color: "white", bold: true },
      { text: "Reset Layout", color: "black", bg: "bgCyan", bold: false },
      { text: " p: ", color: 'white', bold: true },
      { text: "ErrorLog", color: 'black', bg: 'bgCyan', bold: false },
      { text: " u: ", color: 'white', bold: true },
      { text: "Last Updates", color: 'black', bg: 'bgCyan', bold: false },
      { text: " o: ", color: 'white', bold: true },
      { text: "Log", color: 'black', bg: 'bgCyan', bold: false },
      { text: " space: ", color: "white", bold: true },
      { text: "Active/Idle", color: "black", bg: "bgCyan", bold: false },
      // { text: " s:", color: "white", bold: true },
      // { text: "Mode", color: "black", bg: "bgCyan", bold: false },
      // { text: " r:", color: "white", bold: true },
      // { text: "Period", color: "black", bg: "bgCyan", bold: false },
      // { text: ".:", color: "white", bold: true },
      // { text: "Max  ", color: "black", bg: "bgCyan", bold: false },
      // { text: ",:", color: "white", bold: true },
      // { text: "Min  ", color: "black", bg: "bgCyan", bold: false },
    )
    this.footer.setContent(row)
    this.footer.absoluteValues.width = this.gui.Screen.width - 4;
    this.footer.absoluteValues.y = this.gui.Screen.height - 2;
}

  getSelfStats(): void {
    const memoryUsage = process.memoryUsage();
    this.stats.gui.selfStats.capturedErrors = this.errorLog.lastErrors.length;
    // this.stats.gui.selfStats.userTime = convertTimestampToTime(ownCPU.user);
    // this.stats.gui.selfStats.systemTime = convertTimestampToTime(ownCPU.system);
    const memoryValueFormat = Intl.NumberFormat('en-US', { notation: "compact", style: 'unit', unit: 'megabyte', unitDisplay: 'narrow', maximumFractionDigits: 0 });

    const memMB = memoryValueFormat.format(memoryUsage.rss / 1024 / 1024);
    const memHeap = memoryValueFormat.format(memoryUsage.heapUsed / 1024 / 1024);
    const memHeapTotal = memoryValueFormat.format(memoryUsage.heapTotal / 1024 / 1024);    
    this.stats.global.widgetExtra.memMB = memMB;
    this.stats.global.widgetExtra.memHeap = memHeap;
    this.stats.global.widgetExtra.memHeapTotal = memHeapTotal;
  }

  private closeApp() {
    // Add your closing logic here
    console.clear();
    process.exit(0);
  }

  public async drawGUI(): Promise<void> {
    // const p = new PageBuilder();
    const currentTime = Date.now();
    if (!this.settings.gui.shouldIdle || (this.settings.gui.shouldIdle && (currentTime - this.stats.gui.lastUpdates.draw.last) >= 5000)) { // stats.gui.selfStats.isPainting
      this.stats.updateLastUpdates("gui", "draw");
      this.globalStats.printGlobalStats();
      this.globalStats.drawConsole();
      if (this.lastUpdates.active) this.lastUpdates.printLastUpdates();
      this.stats.updateLastUpdates("gui", "draw", true);
    }
  }
}
