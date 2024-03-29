import { Box, ConsoleManager, InPageWidgetBuilder, SimplifiedStyledElement, StyledElement } from "console-gui-tools";
import { IFormatedStats, IRconStatsPlayers } from '../global/statsInstance';
import { returnBoolColor, returnStringIfBool, sOBJ, sSTR } from "../global/functions";
import { settingsContainer, statsContainer } from "../global/containerWrapper";

// interface GlobalStatsDescriptor {
//   "header": { [key: string]: any };
//   "widget": any[];
//   "pid": any[];
//   "web": any[];
//   "server": any[];
//   [key: string]: any[] | { [key: string]: any };
// }
interface IWidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface widgetsControls {
  [key: string]: any;
  header: { box: Box, table: InPageWidgetBuilder };
  widget: { box: Box, table: InPageWidgetBuilder };
  pid: { box: Box, table: InPageWidgetBuilder };
  web: { box: Box, table: InPageWidgetBuilder };
  server: { box: Box, table: InPageWidgetBuilder };
  console: { box: Box, table: InPageWidgetBuilder };
  consoleFS: { box: Box, table: InPageWidgetBuilder };
  rcon: { box: Box, table: InPageWidgetBuilder };
}

// interface IGlobalStatsDefaults {
//   [key: string]: number[];
//   header: number[];
//   widget: number[];
//   pid: number[];
//   web: number[];
//   server: number[];
//   console: number[];
//   rcon: number[];
// }

interface IGlobalStatsMaxSizes {
  [key: string]: number[];
  header: number[];
  widget: number[];
  pid: number[];
  web: number[];
  server: number[];
  console: number[];
  rcon: number[];
  consoleFS: number[];
}

function returnOverheadWidth(minWidth: number, screenWidth: number, widgetWidth: number): number {
  if (minWidth > screenWidth - 6) {
    const widthOverhead = Math.floor((minWidth - screenWidth - 6) / 4) + 3;
    return widgetWidth - widthOverhead;
  } else {
    return widgetWidth;
  }
  return 0;
}

export class displayGlobalStats {
  spacing: number = 2;
  selectedRow: number = 0;
  consoleFUllscreenMode: boolean = false;
  statsWidgets: widgetsControls;
  defaults: Record<string, IWidgetPosition> = {
    header: { x: 2, y: 2, width: 0, height: 2 },
    widget: { x: 0, y: 0, width: 0, height: 11 },
    pid: { x: 0, y: 0, width: 0, height: 11 },
    web: { x: 0, y: 0, width: 0, height: 11 },
    server: { x: 0, y: 0, width: 0, height: 11 },
    console: { x: 0, y: 0, width: 0, height: 7 },
    rcon: { x: 0, y: 0, width: 0, height: 7 },
    consoleFS: { x: 0, y: 0, width: 0, height: 0 },
  };
  maxSizes: IGlobalStatsMaxSizes = { header: [31, 15, 30, 20], widget: [14, 10], pid: [10, 12], web: [12, 15], server: [8, 12], console: [100], rcon: [16, 16, 16], consoleFS: [100], };
  // defaults: IGlobalStatsDefaults = { header: [2, 2, 0, 2], widget: [2, 0, 0, 0], pid: [0, 0, 0, 0], web: [0, 0, 0, 0], server: [0, 0, 0, 0], console: [2, 0, 0, 0], rcon: [0, 0, 0, 0] };
  header: string[] = ["key", "value"];
  rconHeader: string[] = ["name", "playeruid", "steamid"];
  active: boolean = false;
  gui: ConsoleManager;
  constructor(gui: ConsoleManager) {
    this.gui = gui;
    this.updateDefaults = () => {
      const screenWidth = this.gui.Screen.width - 2;
      const screenHeight = this.gui.Screen.height - 2;
      const minWidth = this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.maxSizes.pid[0] + this.maxSizes.pid[1] + this.maxSizes.web[0] + this.maxSizes.web[1] + this.maxSizes.server[0] + this.maxSizes.server[1] + this.spacing * 4;
      this.defaults.header.width = screenWidth - 4;

      this.defaults.widget.x = this.defaults.header.x;
      this.defaults.widget.y = this.defaults.header.height + 3;
      this.defaults.widget.width = this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.spacing,
        // this.defaults.widget.height = Math.floor(screenHeight / 2) - 4;


        this.defaults.pid.x = returnOverheadWidth(minWidth, screenWidth, (this.defaults.widget.x + this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.spacing));
      this.defaults.pid.y = this.defaults.header.height + 3;
      this.defaults.pid.width = this.maxSizes.pid[0] + this.maxSizes.pid[1] + this.spacing;
      // this.defaults.pid.height = Math.floor(screenHeight / 2) - 4;


      this.defaults.web.x = returnOverheadWidth(minWidth, screenWidth, (this.defaults.pid.x + this.maxSizes.pid[0] + this.maxSizes.pid[1] + this.spacing));
      this.defaults.web.y = this.defaults.header.height + 3;
      this.defaults.web.width = this.maxSizes.web[0] + this.maxSizes.web[1] + this.spacing;
      // this.defaults.web.height = Math.floor(screenHeight / 2) - 4;

      this.defaults.server.x = returnOverheadWidth(minWidth, screenWidth, (this.defaults.web.x + this.maxSizes.web[0] + this.maxSizes.web[1] + this.spacing));
      this.defaults.server.y = this.defaults.header.height + 3;
      this.defaults.server.width = this.maxSizes.server[0] + this.maxSizes.server[1] + this.spacing;
      // this.defaults.server.height = Math.floor(screenHeight / 2) - 4;

      this.defaults.rcon.width = this.maxSizes.rcon[0] + this.maxSizes.rcon[1] + this.maxSizes.rcon[2] + this.spacing;
      this.defaults.console.x = this.defaults.header.x;
      this.defaults.console.y = screenHeight - this.defaults.console.height - 2;
      this.defaults.console.width = screenWidth - this.defaults.rcon.width - 2;
      // this.defaults.console.height = this.defaults.console.height;
      this.defaults.rcon.x = this.defaults.console.width + 3;
      this.defaults.rcon.y = screenHeight - this.defaults.rcon.height - 2;
      // this.defaults.rcon.height = this.defaults.rcon.height;
      this.defaults.consoleFS.x = 1;
      this.defaults.consoleFS.y = 1;
      this.defaults.consoleFS.width = screenWidth - 2;
      this.defaults.consoleFS.height = screenHeight - 2;
    };

    // Call the updateDefaults function to initialize the defaults
    this.updateDefaults();

    this.statsWidgets = {
      header: { box: this.createWidgetBox('header', false, false), table: new InPageWidgetBuilder() },
      widget: { box: this.createWidgetBox('widget'), table: new InPageWidgetBuilder() },
      pid: { box: this.createWidgetBox('pid'), table: new InPageWidgetBuilder() },
      web: { box: this.createWidgetBox('web'), table: new InPageWidgetBuilder() },
      server: { box: this.createWidgetBox('server'), table: new InPageWidgetBuilder() },
      rcon: { box: this.createWidgetBox('rcon'), table: new InPageWidgetBuilder() },
      console: { box: this.createWidgetBox('console'), table: new InPageWidgetBuilder() },
      consoleFS: { box: this.createWidgetBox('consoleFS'), table: new InPageWidgetBuilder() }
    };

    this.statsWidgets.header.box.setStyle({ label: "Global Stats", color: "blackBright", boxed: false });
    this.statsWidgets.widget.box.setStyle({ label: "Widget", color: "blackBright", boxed: true });
    this.statsWidgets.pid.box.setStyle({ label: "PID", color: "blackBright", boxed: true });
    this.statsWidgets.web.box.setStyle({ label: "Websocket", color: "blackBright", boxed: true });
    this.statsWidgets.server.box.setStyle({ label: "Server", color: "blackBright", boxed: true });
    this.statsWidgets.rcon.box.setStyle({ label: "Rcon", color: "blackBright", boxed: true });
    this.statsWidgets.console.box.setStyle({ label: "Console", color: "blackBright", boxed: true });
    this.statsWidgets.consoleFS.box.setStyle({ label: "Console Fullscreen", color: "gray", boxed: true });
    this.statsWidgets.consoleFS.box.hide();
    this.statsWidgets.header.box.removeAllListeners();
    this.statsWidgets.widget.box.removeAllListeners();
    this.statsWidgets.pid.box.removeAllListeners();
    this.statsWidgets.web.box.removeAllListeners();
    this.statsWidgets.server.box.removeAllListeners();
    this.statsWidgets.rcon.box.removeAllListeners();
    this.statsWidgets.console.box.removeAllListeners();
  }

  // setupconsoleFSListeners(): void {
  //   this.statsWidgets.consoleFS.box.on("keypress", (key: KeyListenerArgs) => {
  //     if (!this.statsWidgets.consoleFS.box.isVisible() || !this.statsWidgets.consoleFS.box.isFocused()) {
  //       return;
  //     }
  //     switch (key.name) {
  //       case "up":
  //         if (this.selectedRow > 0) {
  //           this.selectedRow -= 1
  //           this.drawConsole();
  //           // this.detailBox.show();
  //         }
  //         break
  //       case "down":
  //         if (this.selectedRow < this.statsWidgets.consoleFS.table.content.length - 1) {
  //           this.selectedRow += 1
  //           this.drawConsole();
  //           // this.detailBox.show();
  //         }
  //         break
  //     }
  //     // this.drawErrorTable();
  //   });

  // }

  private createWidgetBox(widgetName: string, draggable: boolean = true, boxed: boolean = true): Box {
    const config = this.defaults[widgetName];
    return new Box({
      id: `stats${widgetName}`,
      ...config,
      draggable: draggable,
      style: { label: widgetName, boxed: boxed }
    });
  }
  // "GUI Events": `${EventEmitterMixin.eventStats.guiActiveEvents}`,
  // "APP Events": `${EventEmitterMixin.eventStats.errorCounter}`,
  // "Error count": `${EventEmitterMixin.eventStats.errorCounter}`,
  public updateDefaults: () => void;

  async drawStats(FormatedObject: IFormatedStats): Promise<void> {
    const mainKeys = Object.keys(FormatedObject)
    // let m = 0;
    for (let mainKey of mainKeys) {
      switch (mainKey) {
        case "header":
          this.statsWidgets[mainKey].table.clear();
          const localTime = `${FormatedObject['extras']['localTime']}`;
          const leftHeaderText = `${FormatedObject['extras']['firstHeader']}`;
          const rightHeaderText = `${FormatedObject['extras']['secondHeader']}`;
          const freeMiddleSpace = (this.gui.Screen.width - 10 - Number(`${leftHeaderText}${rightHeaderText}${localTime}`.length));

          this.statsWidgets[mainKey].table.addRow(
            sOBJ(2), { text: localTime, inverse: true, },
            sOBJ(freeMiddleSpace),
            { text: leftHeaderText, color: 'magenta', bold: true },
            sOBJ(1), { text: rightHeaderText, color: 'blueBright', bold: true }
          );
          const headerKeys = Object.keys(FormatedObject[mainKey])
          let i = 0;
          let cellRow: SimplifiedStyledElement[] = [{ ...sOBJ(1) }];
          for (let key of headerKeys) {
            const value = `${key}: ${FormatedObject[mainKey][key]}`;
            const cellText = `${value}${` `.repeat(Math.max(this.maxSizes[mainKey][i] - `${value}`.length, 0))}`;
            const cellColumn = { text: cellText, color: 'whiteBright', bold: true };
            cellRow.push(cellColumn as SimplifiedStyledElement);
            i++;
          }
          this.statsWidgets[mainKey].table.addRow(...cellRow);
          this.statsWidgets[mainKey].box.setContent(this.statsWidgets[mainKey].table);
          break;
        case "extras":
          return;
        case "rcon":
          const tempRconMaxSizes = this.maxSizes[mainKey];
          const tempRconFormatedObject = FormatedObject[mainKey];
          this.statsWidgets[mainKey].table.clear();
          const portOpen = tempRconFormatedObject['port open'];
          const connected = tempRconFormatedObject['connected'];
          this.statsWidgets[mainKey].table.addRow(
            { text: `Status:   `, color: 'cyanBright', bold: true },
            { text: `port open `, color: 'whiteBright', bold: true },
            { text: `${portOpen}`, color: returnBoolColor(portOpen), bold: true },
            sOBJ(3),
            { text: `connected `, color: 'whiteBright', bold: true },
            { text: `${connected}`, color: returnBoolColor(connected), bold: true },
          );
          // const playerFiller = ` `.repeat((Math.max(30, ` connected player `.length)) / 2);
          // this.statsWidgets[mainKey].table.addRow(
          //   { text: `${playerFiller} connected player ${playerFiller}`, color: 'cyanBright', bold: true, overline: true },
          // );
          // const headerFirstBefore = ` `.repeat(Math.max(Math.floor(tempRconMaxSizes[0] / 2 - `${this.rconHeader[0]}`.length), 0));
          // const headerFirstAfter = ` `.repeat(Math.max(Math.floor(tempRconMaxSizes[0] / 2 - `${this.rconHeader[0]}`.length), 0));
          // const headerSecondBefore = ` `.repeat(Math.max(Math.floor(tempRconMaxSizes[1] / 2 - `${this.rconHeader[1]}`.length), 0));
          // const headerSecondAfter = ` `.repeat(Math.max(Math.floor(tempRconMaxSizes[1] / 2 - `${this.rconHeader[1]}`.length), 0));
          // const headerThirdBefore = ` `.repeat(Math.max(Math.floor(tempRconMaxSizes[2] / 2 - `${this.rconHeader[2]}`.length), 0));
          // const headerThirdAfter = ` `.repeat(Math.max(Math.floor(tempRconMaxSizes[2] / 2 - `${this.rconHeader[2]}`.length), 0));
          this.statsWidgets[mainKey].table.addRow(
            { text: `${sSTR(5)}${this.rconHeader[0]}${sSTR(6)}|`, color: 'yellow', bold: true, underline: true },
            { text: `${sSTR(3)}${this.rconHeader[1]}${sSTR(3)}|`, color: 'yellow', bold: true, underline: true },
            { text: `${sSTR(4)}${this.rconHeader[2]}${sSTR(5)}`, color: 'yellow', bold: true, underline: true },
          );
          // Loop through array of players
          tempRconFormatedObject['players'].forEach((Element: IRconStatsPlayers) => {
            this.statsWidgets[mainKey].table.addRow(
              { text: `${Element.name}${` `.repeat(Math.max(tempRconMaxSizes[0] - `${Element.name}`.length, 0))}`, color: 'whiteBright' },
              { text: `${Element.playeruid}${` `.repeat(Math.max(tempRconMaxSizes[1] - `${Element.playeruid}`.length, 0))}`, color: 'whiteBright' },
              { text: `${Element.steamid}${` `.repeat(Math.max(tempRconMaxSizes[2] - `${Element.steamid}`.length, 0))}`, color: 'whiteBright' },

            );
          });
          this.statsWidgets[mainKey].box.setContent(this.statsWidgets[mainKey].table);
          break;
        default:
          const tempFormatedObject = FormatedObject[mainKey] as { [key: string]: string | boolean | number; };
          const tempMaxSizes = this.maxSizes[mainKey];
          const keys = Object.keys(tempFormatedObject)
          this.statsWidgets[mainKey].table.clear();
          let modifiedValue: string | boolean | number;
          for (let key of keys) {
            const value: string | boolean | number = tempFormatedObject[key];
            const color = typeof value === 'boolean' ? returnBoolColor(value) : 'whiteBright';
            switch (key) {
              case 'refresh rate':
                const refreshShouldStop = settingsContainer.getSetting('gui', 'shouldStop');
                const refreshShouldIdle = settingsContainer.getSetting('gui', 'shouldIdle');
                const refreshAltValuePeriod = `${settingsContainer.getSetting('gui', 'period')} ms`;
                modifiedValue = (refreshShouldStop || refreshShouldIdle ? (refreshShouldStop ? returnStringIfBool(refreshShouldStop as boolean, `stop`) : returnStringIfBool(refreshShouldIdle as boolean, `idle`)) : refreshAltValuePeriod);
                break;
              case 'webIntval':
                const websocketShouldStop = settingsContainer.getSetting('clients', 'shouldStop');
                const websocketShouldIdle = settingsContainer.getSetting('clients', 'shouldIdle');
                const websocketaltValuePeriod = `${settingsContainer.getSetting('clients', 'period')} ms`;
                modifiedValue = (websocketShouldStop || websocketShouldIdle ? (websocketShouldStop ? returnStringIfBool(websocketShouldStop as boolean, `stop`) : returnStringIfBool(websocketShouldIdle as boolean, `idle`)) : websocketaltValuePeriod);
                break;
              case 'pidIntval':
                const gatherShouldStop = settingsContainer.getSetting('pid', 'shouldStop');
                const gatherShouldIdle = settingsContainer.getSetting('pid', 'shouldIdle');
                const gatheraltValuePeriod = `${settingsContainer.getSetting('pid', 'period')} ms`;
                modifiedValue = (gatherShouldStop || gatherShouldIdle ? (gatherShouldStop ? returnStringIfBool(gatherShouldStop as boolean, `stop`) : returnStringIfBool(gatherShouldIdle as boolean, `idle`)) : gatheraltValuePeriod);
                break;
              default:
                modifiedValue = value;
                break;
            }

            const modifiedKey = `${key}${` `.repeat(Math.max(tempMaxSizes[0] - `${key}`.length, 0))}`;
            const cellText = `${` `.repeat(Math.max(tempMaxSizes[1] - `${modifiedValue}`.length, 0))}${modifiedValue}`;
            this.statsWidgets[mainKey].table.addRow(
              { text: modifiedKey, color: 'whiteBright' },
              { text: cellText, color: color }
            );
          }
          // m++;
          this.statsWidgets[mainKey].box.setContent(this.statsWidgets[mainKey].table);
          break;
      }
    }
  }

  async drawConsole(): Promise<void> {
    let consoleBoxUsed = this.consoleFUllscreenMode ? this.statsWidgets.consoleFS.box : this.statsWidgets.console.box;
    let consoleBoxNotUsed = this.consoleFUllscreenMode ? this.statsWidgets.console.box : this.statsWidgets.consoleFS.box;
    
    let temp: SimplifiedStyledElement[] = [];
    consoleBoxUsed.CM.stdOut.getContent().forEach((row: any[]) => {
      row.forEach((Element: StyledElement) => {
        const style = Element.style;
        const value = `${Element.text}`;
        const cellText = { text: value, color: style.color, bold: style.bold, italic: style.italic, dim: style.dim, underline: style.underline, inverse: style.inverse, hidden: style.hidden, strikethrough: style.strikethrough, overline: style.overline };
        temp.push(cellText);
      });
      this.statsWidgets.console.table.addRow(...temp);
    });
    consoleBoxUsed.setContent(this.statsWidgets.console.box.CM.stdOut).draw();
    if (!consoleBoxUsed.isVisible()) {
      consoleBoxUsed.show();
      // if (this.consoleFUllscreenMode) this.setupconsoleFSListeners();
    }
    if (consoleBoxNotUsed.isVisible()) {
      consoleBoxNotUsed.hide();
      // if (!this.consoleFUllscreenMode) this.statsWidgets.consoleFS.box.removeAllListeners();
    }
    if (this.consoleFUllscreenMode) {
      this.statsWidgets.consoleFS.box.focus();
    }
  }

  printGlobalStats(): void {
    const stats = statsContainer.getFormatedStats();
    this.drawStats(stats);
  }
}