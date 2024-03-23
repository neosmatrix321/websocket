
"use strict";
import { injectable } from 'inversify';
import "reflect-metadata";

import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IEventTypes, INewErr, MainEventTypes, SubEventTypes } from '../global/eventInterface';
import { settingsWrapper } from '../settings/settingsInstance';
import { statsWrapper } from '../stats/statsInstance';
// Import module with ES6 syntax
import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ButtonPopup, CustomPopup, InPageWidgetBuilder, SimplifiedStyledElement, Box, KeyListenerArgs } from 'console-gui-tools'
import { settingsContainer, statsContainer } from '../global/containerWrapper';
import { ErrorTable } from './errorGen';
import { displayLastUpdates } from './displayLastUpdates';
import { displayGlobalStats } from './displayGlobalStats';
import { COLORS, columnWrapperText, getRGBString, D, M, sOBJ, printAliveStatus } from '../global/functions';
// import { displayLastUpdates } from './displayLastUpdates';


function createTwoRow(obj: any, p: InPageWidgetBuilder): void {
  switch (typeof obj) {
    case 'object':
      obj.forEach((value: string, key: string) => {
        if (key && value) {
          const totalPadding1 = ' '.repeat(Math.max(0, 30 - key.length - value.length));
          const newValue1: SimplifiedStyledElement = columnWrapperText(key, getRGBString(value));
          const middle: SimplifiedStyledElement = columnWrapperText(totalPadding1);
          const newValue2: SimplifiedStyledElement = columnWrapperText(key, getRGBString(value));
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
    this.gui.refresh();
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
    this.footer.show();
    this.guiIntVat = setInterval(async () => {
    }, 1000);
    clearInterval(this.guiIntVat);

    this.globalStats = new displayGlobalStats(this.gui);
    this.lastUpdates = new displayLastUpdates();
    this.errorLog = new ErrorTable(); // Use the width of your 'ErrorLog' Box
  }
  public startIfTTY() {
    if (!this.gui.Screen.Terminal.isTTY) return console.info('No TTY detected, skipping console-gui-tools');
    this.setupEventListeners();
    this.drawGUI();
    this.printFooter();
    this.stats.updateLastUpdates("gui", "start", true);

    this.guiIntVat = setInterval(async () => {
      this.intervalRunner();
    }, this.settings.gui.period);
    this.stats.gui.selfStats.isPainting = true;
    if (!this.settings.gui.shouldPaint) this.toggleIdleMode();
    // this.gui.showLogPopup();
  }

  intervalRunner() {
    // this.settings.gui.refreshCounter += 1;
    this.drawGUI();
  }

  private toggleIdleMode(forceHalt: boolean = false) {
    if (this.stats.gui.selfStats.isPainting) {
      this.stats.gui.selfStats.isPainting = false;
      if (forceHalt) clearInterval(this.guiIntVat);
    } else {
      this.stats.gui.selfStats.isPainting = true;
      if (forceHalt) this.guiIntVat = setInterval(async () => {
        this.intervalRunner();
      }, this.settings.gui.period);
    }
    this.globalStats.printGlobalStats();
    this.globalStats.drawConsole();
  }

  private resizeDefaults(reset: boolean = false) {
    this.errorLog.errorLogBox.hide();
    this.gui.Screen.update();
    this.gui.refresh();
    this.stats.gui.selfStats.width = this.gui.Screen.width;
    this.stats.gui.selfStats.height = this.gui.Screen.height;
    this.globalStats.statsWidgets.header.box.absoluteValues.width = this.gui.Screen.width - 7;
    if (reset) {
      this.globalStats.statsWidgets.widget.box.absoluteValues.x = this.globalStats.defaults.widget[0];
      this.globalStats.statsWidgets.widget.box.absoluteValues.y = this.globalStats.defaults.widget[1];
      this.globalStats.statsWidgets.pid.box.absoluteValues.x = this.globalStats.defaults.pid[0];
      this.globalStats.statsWidgets.pid.box.absoluteValues.y = this.globalStats.defaults.pid[1];
      this.globalStats.statsWidgets.web.box.absoluteValues.x = this.globalStats.defaults.web[0];
      this.globalStats.statsWidgets.web.box.absoluteValues.y = this.globalStats.defaults.web[1];
      this.globalStats.statsWidgets.server.box.absoluteValues.x = this.globalStats.defaults.server[0];
      this.globalStats.statsWidgets.server.box.absoluteValues.y = this.globalStats.defaults.server[1];
    }
    this.globalStats.statsWidgets.console.box.absoluteValues.y = this.globalStats.defaults.console[1];
    this.globalStats.statsWidgets.console.box.absoluteValues.width = this.globalStats.defaults.console[2];
    this.globalStats.statsWidgets.console.box.absoluteValues.height = this.globalStats.defaults.console[3];
    this.footer.absoluteValues.width = this.gui.Screen.width - 4;
    this.footer.absoluteValues.y = this.stats.gui.selfStats.height - 2;
    this.globalStats.printGlobalStats();
    this.globalStats.drawConsole();
    
    this.printFooter();
    this.gui.refresh();
  }

  private setupEventListeners() {
    this.eV.on(MainEventTypes.GUI, (event: IEventTypes) => {
      switch (event.subType) {
        case SubEventTypes.GUI.PRINT_DEBUG:
          this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `GUI` });
          // console.log("Clients:");
          // console.dir(this.clients, { depth: 3, colors: true });
          break;
        case SubEventTypes.GUI.UPDATE_STATS:
          this.getSelfStats();
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
      this.resizeDefaults();
      // console.info(`GUI resized to: ${statsContainer.gui.selfStats.width}x${statsContainer.gui.selfStats.height}`);
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
            this.gui.setLogPageSize(100);
            // this.gui.Screen.Terminal. = this.gui.Screen.height - 4;
            
          }
          break;
        }
        case "space": {
          this.toggleIdleMode(true);
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
                clearInterval(this.guiIntVat);
                this.guiIntVat = setInterval(async () => {
                  this.intervalRunner();
                }, this.settings.gui.period);
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
          break;
        }
        case "f12": {
          this.resizeDefaults(true);
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

  // Funktion zur Ermittlung der Farbe für Log-Level
  private async printFooter() {
    const row = new InPageWidgetBuilder(1)

    row.addRow(
      { text: "F1: ", color: "white", bold: true },
      { text: "Help", color: "black", bg: "bgCyan", bold: false },
      { text: " f2: ", color: "white", bold: true },
      { text: "Colors", color: "black", bg: "bgCyan", bold: false },
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
    if (this.stats.gui.selfStats.isPainting) {
      this.globalStats.printGlobalStats();
      this.globalStats.drawConsole();
      if (this.lastUpdates.active) this.lastUpdates.printLastUpdates();
      this.stats.updateLastUpdates("gui", "draw", true);
    } else {
      const currentTime = Date.now();
      if ((currentTime - this.stats.gui.lastUpdates.draw.last) >= 1500) {
        this.globalStats.drawConsole();
        if ((currentTime - this.stats.gui.lastUpdates.draw.last) >= 10000) {
          this.stats.updateLastUpdates("gui", "draw", true);
          this.globalStats.printGlobalStats();
        }
      }
    }
  }
}
