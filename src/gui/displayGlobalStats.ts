import { Box, ConsoleManager, InPageWidgetBuilder, SimplifiedStyledElement, StyledElement } from "console-gui-tools";
import { IFormatedStats } from '../global/statsInstance';
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
}
interface IGlobalStatsDefaults {
  [key: string]: number[];
  header: number[];
  widget: number[];
  pid: number[];
  web: number[];
  server: number[];
  console: number[];
}

interface IGlobalStatsMaxSizes {
  [key: string]: number[];
  header: number[];
  widget: number[];
  pid: number[];
  web: number[];
  server: number[];
  console: number[];
}

export class displayGlobalStats {
  spacing: number = 2;
  selectedRow: number = 0;
  statsWidgets: widgetsControls;
  maxSizes: IGlobalStatsMaxSizes = { "header": [31, 15, 30, 20], "widget": [14, 10], "pid": [10, 12], "web": [12, 15], "server": [8, 12], "console": [100] };
  defaults: IGlobalStatsDefaults = { 'header': [2, 2, 100, 2], "widget": [2, 5, this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.spacing, 11], "pid": [0, 5, 0, 0], "web": [0, 5, 0, 0], "server": [0, 5, 0, 0], "console": [0, 0, 0 ,0] };
  header: string[] = ["key", "value"];
  active: boolean = false;
  gui: ConsoleManager;
  constructor(gui: ConsoleManager) {
    this.gui = gui;
    this.defaults = Object.assign(this.defaults, {  "header": [2, 2, this.gui.Screen.width - 4, 2] });
    const headerBoxConfig = {
      id: "statsHeader",
      x: this.defaults.header[0],
      y: this.defaults.header[1],
      width: this.defaults.header[2],
      height: this.defaults.header[3],
      style: { boxed: false, },
    };

    this.defaults = Object.assign(this.defaults, { "widget": [2, 5, this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.spacing, 11] });
    const widgetBoxConfig = {
      id: "statsWidget",
      x: this.defaults.widget[0],
      y: this.defaults.widget[1],
      width: this.defaults.widget[2],
      height: this.defaults.widget[3],
      draggable: true,
      style: { label: "Widget", boxed: true, }
    };
    
    this.defaults = Object.assign(this.defaults, {
      "pid": [this.defaults.widget[0] + this.maxSizes.widget[0] + this.maxSizes.widget[1] + 2, 5, this.maxSizes.pid[0] + this.maxSizes.pid[1] + this.spacing, 11],
    });
    const pidBoxConfig = {
      id: "statsPid",
      x: this.defaults.pid[0],
      y: this.defaults.pid[1],
      width: this.defaults.pid[2],
      height: this.defaults.pid[3],
      draggable: true,
      style: { label: "Pid", boxed: true }
    };

    this.defaults = Object.assign(this.defaults, {
      "web": [this.defaults.pid[0] + this.maxSizes.pid[0] + this.maxSizes.pid[1] + 2, 5, this.maxSizes.web[0] + this.maxSizes.web[1] + this.spacing, 9],
    });

    const webBoxConfig = {
      id: "statsWeb",
      x: this.defaults.web[0],
      y: this.defaults.web[1],
      width: this.defaults.web[2],
      height: this.defaults.web[3],
      draggable: true,
      style: { label: "Web", boxed: true }
    };

    this.defaults = Object.assign(this.defaults, {
      "server": [this.defaults.web[0] + this.maxSizes.web[0] + this.maxSizes.web[1] + 2, 5, this.maxSizes.server[0] + this.maxSizes.server[1] + this.spacing, 8],
    });

    const serverBoxConfig = {
      id: "statsServer",
      x: this.defaults.server[0],
      y: this.defaults.server[1],
      width: this.defaults.server[2],
      height: this.defaults.server[3],
      draggable: true,
      style: { label: "Server", boxed: true }
    };

    this.defaults = Object.assign(this.defaults, {
      "console": [2, 15, 50, 14], // TODO: callbacks
    });  // TODO: alt width this.gui.Screen.width - 4
    const consoleBoxConfig = {
      id: "statsConsole",
      x: this.defaults.console[0],
      y: this.defaults.console[1],
      width: this.defaults.console[2],
      height: this.defaults.console[3],
      draggable: true,
      style: { label: "Console", boxed: true }
    };


    this.statsWidgets = {
      header: { box: new Box({ ...headerBoxConfig }), table: new InPageWidgetBuilder() },
      widget: { box: new Box({ ...widgetBoxConfig }), table: new InPageWidgetBuilder() },
      pid: { box: new Box({ ...pidBoxConfig }), table: new InPageWidgetBuilder() },
      web: { box: new Box({ ...webBoxConfig }), table: new InPageWidgetBuilder() },
      server: { box: new Box({ ...serverBoxConfig }), table: new InPageWidgetBuilder() },
      console: { box: new Box({ ...consoleBoxConfig }), table: new InPageWidgetBuilder() },
    };
  }

  // "GUI Events": `${EventEmitterMixin.eventStats.guiActiveEvents}`,
  // "APP Events": `${EventEmitterMixin.eventStats.errorCounter}`,
  // "Error count": `${EventEmitterMixin.eventStats.errorCounter}`,

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
        default:
          const tempFormatedObject = FormatedObject[mainKey] as { [key: string]: string | boolean | number; };
          const tempMaxSizes = this.maxSizes[mainKey];
          const keys = Object.keys(tempFormatedObject)
          const shouldStop = settingsContainer.getSetting('gui', 'shouldStop');
          const shouldIdle = settingsContainer.getSetting('gui', 'shouldIdle');
          const altValuePeriod = `${settingsContainer.getSetting('gui', 'period')} ms`;
          this.statsWidgets[mainKey].table.clear();
          for (let key of keys) {
            const value: string | boolean | number = tempFormatedObject[key];
            const color = typeof value === 'boolean' ? returnBoolColor(value) : 'whiteBright';
            const modifiedValue: string | boolean | number = key == 'refresh rate' ? (shouldStop || shouldIdle ? (shouldStop ? returnStringIfBool(shouldStop as boolean, `stop`) : returnStringIfBool(shouldIdle as boolean, `idle`) ) : altValuePeriod) : `${value}`;

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