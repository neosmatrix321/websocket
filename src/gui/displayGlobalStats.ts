import { Box, ConsoleManager, InPageWidgetBuilder, SimplifiedStyledElement, StyledElement } from "console-gui-tools";
import { IFormatedStats, IRconStatsPlayers } from '../global/statsInstance';
import { returnBoolColor, returnStringIfBool, sOBJ } from "../global/functions";
import { settingsContainer, statsContainer } from "../global/containerWrapper";

// interface GlobalStatsDescriptor {
//   "header": { [key: string]: any };
//   "widget": any[];
//   "pid": any[];
//   "web": any[];
//   "server": any[];
//   [key: string]: any[] | { [key: string]: any };
// }

interface widgetsControls {
  [key: string]: any;
  header: { box: Box, table: InPageWidgetBuilder, };
  widget: { box: Box, table: InPageWidgetBuilder };
  pid: { box: Box, table: InPageWidgetBuilder };
  web: { box: Box, table: InPageWidgetBuilder };
  server: { box: Box, table: InPageWidgetBuilder };
  console: { box: Box, table: InPageWidgetBuilder };
  rcon: { box: Box, table: InPageWidgetBuilder };
}
interface IGlobalStatsDefaults {
  [key: string]: number[];
  header: number[];
  widget: number[];
  pid: number[];
  web: number[];
  server: number[];
  console: number[];
  rcon: number[];
}

interface IGlobalStatsMaxSizes {
  [key: string]: number[];
  header: number[];
  widget: number[];
  pid: number[];
  web: number[];
  server: number[];
  console: number[];
  rcon: number[];
}

export class displayGlobalStats {
  spacing: number = 2;
  selectedRow: number = 0;
  statsWidgets: widgetsControls;
  maxSizes: IGlobalStatsMaxSizes = { header: [31, 15, 30, 20], widget: [14, 10], pid: [10, 12], web: [12, 15], server: [8, 12], console: [100], rcon: [16, 16, 16] };
  defaults: IGlobalStatsDefaults = { header: [2, 2, 0, 2], widget: [2, 0, 0, 0], pid: [0, 0, 0, 0], web: [0, 0, 0, 0], server: [0, 0, 0, 0], console: [2, 0, 0, 0], rcon: [0, 0, 0, 0] };
  header: string[] = ["key", "value"];
  rconHeader: string[] = ["name", "playeruid", "steamid"];
  active: boolean = false;
  gui: ConsoleManager;
  constructor(gui: ConsoleManager) {
    this.gui = gui;
    this.updateDefaults = () => {
      this.defaults.header = [
          this.defaults.header[0],
          this.defaults.header[1],
          this.gui.Screen.width - 4,
          this.defaults.header[3]
      ];
      this.defaults.widget = [
          this.defaults.widget[0],
          this.defaults.header[3] + 3,
          this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.spacing,
          Math.floor(this.gui.Screen.height / 2) - 4
      ];
      this.defaults.pid = [
          this.defaults.widget[0] + this.maxSizes.widget[0] + this.maxSizes.widget[1] + 2,
          this.defaults.header[3] + 3,
          this.maxSizes.pid[0] + this.maxSizes.pid[1] + this.spacing,
          Math.floor(this.gui.Screen.height / 2) - 4,
      ];
      this.defaults.web = [
          this.defaults.pid[0] + this.maxSizes.pid[0] + this.maxSizes.pid[1] + 2,
          this.defaults.header[3] + 3,
          this.maxSizes.web[0] + this.maxSizes.web[1] + this.spacing,
          Math.floor(this.gui.Screen.height / 2) - 4,
      ];
      this.defaults.server = [
          this.defaults.web[0] + this.maxSizes.web[0] + this.maxSizes.web[1] + 2,
          this.defaults.header[3] + 3,
          this.maxSizes.server[0] + this.maxSizes.server[1] + this.spacing,
          Math.floor(this.gui.Screen.height / 2) - 4,
      ];
      this.defaults.console = [
          this.defaults.console[0],
          this.defaults.widget[3] + this.defaults.header[3] + 1,
          Math.floor(this.gui.Screen.width / 2) - 2,
          Math.floor(this.gui.Screen.height) - this.defaults.header[3] + this.defaults.widget[3] - 4,
      ];
      this.defaults.rcon = [
          this.defaults.console[2] + 3,
          this.defaults.widget[3] + this.defaults.header[3] + 1,
          Math.floor(this.gui.Screen.width / 2) - 2,
          Math.floor(this.gui.Screen.height) - this.defaults.header[3] + this.defaults.widget[3] - 4,
      ];
    }

    // Call the updateDefaults function to initialize the defaults
    this.updateDefaults();

    const headerBoxConfig = {
      id: "statsHeader",
      x: this.defaults.header[0],
      y: this.defaults.header[1],
      width: this.defaults.header[2],
      height: this.defaults.header[3],
      style: { boxed: false, },
    };

    const widgetBoxConfig = {
      id: "statsWidget",
      x: this.defaults.widget[0],
      y: this.defaults.widget[1],
      width: this.defaults.widget[2],
      height: this.defaults.widget[3],
      draggable: true,
      style: { label: "Widget", boxed: true, }
    };

    const pidBoxConfig = {
      id: "statsPid",
      x: this.defaults.pid[0],
      y: this.defaults.pid[1],
      width: this.defaults.pid[2],
      height: this.defaults.pid[3],
      draggable: true,
      style: { label: "Pid", boxed: true }
    };

    const webBoxConfig = {
      id: "statsWeb",
      x: this.defaults.web[0],
      y: this.defaults.web[1],
      width: this.defaults.web[2],
      height: this.defaults.web[3],
      draggable: true,
      style: { label: "Web", boxed: true }
    };

    const serverBoxConfig = {
      id: "statsServer",
      x: this.defaults.server[0],
      y: this.defaults.server[1],
      width: this.defaults.server[2],
      height: this.defaults.server[3],
      draggable: true,
      style: { label: "Server", boxed: true }
    };

    const consoleBoxConfig = {
      id: "statsConsole",
      x: this.defaults.console[0],
      y: this.defaults.console[1],
      width: this.defaults.console[2],
      height: this.defaults.console[3],
      draggable: true,
      style: { label: "Console", boxed: true }
    };

    const rconBoxConfig = {
      id: "statsRcon",
      x: this.defaults.rcon[0],
      y: this.defaults.rcon[1],
      width: this.defaults.rcon[2],
      height: this.defaults.rcon[3],
      draggable: true,
      style: { label: "Players Connected", boxed: true }
    }

    this.statsWidgets = {
      header: { box: new Box({ ...headerBoxConfig }), table: new InPageWidgetBuilder() },
      widget: { box: new Box({ ...widgetBoxConfig }), table: new InPageWidgetBuilder() },
      pid: { box: new Box({ ...pidBoxConfig }), table: new InPageWidgetBuilder() },
      web: { box: new Box({ ...webBoxConfig }), table: new InPageWidgetBuilder() },
      server: { box: new Box({ ...serverBoxConfig }), table: new InPageWidgetBuilder() },
      rcon: { box: new Box({ ...rconBoxConfig }), table: new InPageWidgetBuilder() },
      console: { box: new Box({ ...consoleBoxConfig }), table: new InPageWidgetBuilder() },
    };
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
          this.statsWidgets[mainKey].table.clear();
          const tempRconFormatedObject = FormatedObject[mainKey].players as IRconStatsPlayers[];
          const tempRconMaxSizes = this.maxSizes[mainKey];
          this.statsWidgets[mainKey].table.addRow(
            { text: `${this.rconHeader[0]}${` `.repeat(Math.max(tempRconMaxSizes[0] - `${this.rconHeader[0]}`.length, 0))}`, color: 'whiteBright', bold: true },
            { text: `${this.rconHeader[1]}${` `.repeat(Math.max(tempRconMaxSizes[1] - `${this.rconHeader[1]}`.length, 0))}`, color: 'whiteBright', bold: true },
            { text: `${this.rconHeader[2]}${` `.repeat(Math.max(tempRconMaxSizes[2] - `${this.rconHeader[2]}`.length, 0))}`, color: 'whiteBright', bold: true }
          );
          // Loop through array of players
          tempRconFormatedObject.forEach((Element: IRconStatsPlayers) => {
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
              case 'websocket':
                const websocketShouldStop = settingsContainer.getSetting('clients', 'shouldStop');
                const websocketShouldIdle = settingsContainer.getSetting('clients', 'shouldIdle');
                const websocketaltValuePeriod = `${settingsContainer.getSetting('clients', 'period')} ms`;
                modifiedValue = (websocketShouldStop || websocketShouldIdle ? (websocketShouldStop ? returnStringIfBool(websocketShouldStop as boolean, `stop`) : returnStringIfBool(websocketShouldIdle as boolean, `idle`)) : websocketaltValuePeriod);
                break;
              case 'gather':
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
    this.statsWidgets.console.table.clear();
    let temp: SimplifiedStyledElement[] = [];
    this.statsWidgets.console.box.CM.stdOut.getContent().forEach((row: any[]) => {
      row.forEach((Element: StyledElement) => {
        const style = Element.style;
        const value = `${Element.text}`;
        const cellText = { text: value, color: style.color, bold: style.bold, italic: style.italic, dim: style.dim, underline: style.underline, inverse: style.inverse, hidden: style.hidden, strikethrough: style.strikethrough, overline: style.overline };
        temp.push(cellText);
      });
      this.statsWidgets.console.table.addRow(...temp);
    });
    this.statsWidgets.console.box.setContent(this.statsWidgets.console.box.CM.stdOut).draw();
  }

  printGlobalStats(): void {
    const stats = statsContainer.getFormatedStats();
    this.drawStats(stats);
  }
}