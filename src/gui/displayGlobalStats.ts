import { Box, InPageWidgetBuilder, SimplifiedStyledElement, StyledElement } from "console-gui-tools";
import { IFormatedStats } from '../stats/statsInstance';
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

export class displayGlobalStats {
  selectedRow: number = 0;
  statsWidgets: widgetsControls;
  maxSizes: { [key: string]: number[] } = { "header": [31, 15, 30, 20], "widget": [14, 10], "pid": [10, 12], "web": [16, 12], "server": [8, 12], "concole": [100] };
  defaults: { [key: string]: number[] } = { 'header': [2, 2], "widget": [2, 5], };
  header: string[] = ["key", "value"];
  spacing: number = 2;
  active: boolean = false;
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.defaults = Object.assign(this.defaults, { "pid": [this.defaults.widget[0] + this.maxSizes.widget[0] + this.maxSizes.widget[1] + 2, 5], });
    this.defaults = Object.assign(this.defaults, { "web": [this.defaults.pid[0] + this.maxSizes.pid[0] + this.maxSizes.pid[1] + 2, 5], });
    this.defaults = Object.assign(this.defaults, { "server": [this.defaults.web[0] + this.maxSizes.web[0] + this.maxSizes.web[1] + 2, 5], });
    this.defaults = Object.assign(this.defaults, { "console": [2, (this.height - 10)] });
    const headerBoxConfig = { id: "statsHeader", x: this.defaults.header[0], y: this.defaults.header[1], width: 103, height: 3, style: { boxed: false } };
    const widgetBoxConfig = { id: "statsWidget", x: this.defaults.widget[0], y: this.defaults.widget[1], width: this.maxSizes.widget[0] + this.maxSizes.widget[1] + this.spacing, height: 14, draggable: true, style: { label: "Widget", boxed: true,  } };
    const pidBoxConfig = { id: "statsPid", x: this.defaults.pid[0], y: this.defaults.pid[1], width: this.maxSizes.pid[0] + this.maxSizes.pid[1] + this.spacing, height: 10, draggable: true, style: { label: "Pid", boxed: true } };
    const webBoxConfig = { id: "statsWeb", x: this.defaults.web[0], y: this.defaults.web[1], width: this.maxSizes.web[0] + this.maxSizes.web[1] + this.spacing, height: 9, draggable: true, style: { label: "Web", boxed: true } };
    const serverBoxConfig = { id: "statsServer", x: this.defaults.server[0], y: this.defaults.server[1], width: this.maxSizes.server[0] + this.maxSizes.server[1] + this.spacing, height: 6, draggable: true, style: { label: "Server", boxed: true } };
    const consoleBoxConfig = { id: "statsConsole", x: this.defaults.console[0], y: this.defaults.console[1], width: 100, height: 7, draggable: true, style: { label: "Console", boxed: true } };
    
    this.statsWidgets = {
      header: { box: new Box({...headerBoxConfig }), table: new InPageWidgetBuilder(3) },
      widget: { box: new Box({...widgetBoxConfig}), table: new InPageWidgetBuilder() },
      pid: { box: new Box({...pidBoxConfig}), table: new InPageWidgetBuilder() },
      web: { box: new Box({...webBoxConfig}), table: new InPageWidgetBuilder() },
      server: { box: new Box({...serverBoxConfig}), table: new InPageWidgetBuilder() },
      console: { box: new Box({...consoleBoxConfig}), table: new InPageWidgetBuilder() },
    };
  }
  
  // "GUI Events": `${EventEmitterMixin.eventStats.guiActiveEvents}`,
  // "APP Events": `${EventEmitterMixin.eventStats.errorCounter}`,
  // "Error count": `${EventEmitterMixin.eventStats.errorCounter}`,

  async drawStats(FornatedObject: IFormatedStats): Promise<void> {
    const mainKeys = Object.keys(FornatedObject)
    // let m = 0;
    for (let mainKey of mainKeys) {
      switch (mainKey) {
        case "header":
          this.statsWidgets[mainKey].table.clear();
          this.statsWidgets[mainKey].table.addRow( sOBJ(2), { text: `This Widget controls:`, color: 'magenta', bold: true }, sOBJ(1), { text: `(insert Palserver name)`, color: 'blueBright', bold: true });
          const headerKeys = Object.keys(FornatedObject[mainKey])
          let i = 0;
          let cellRow: SimplifiedStyledElement[] = [ sOBJ(1),];
          for (let key of headerKeys) {
            const value = `${key}: ${FornatedObject[mainKey][key]}`;
            const cellText = `${value}${` `.repeat(Math.max(this.maxSizes[mainKey][i] - `${value}`.length, 0))}`;
            const cellColumn = { text: cellText, color: 'whiteBright', bold: true};
            cellRow.push(cellColumn as SimplifiedStyledElement);
            i++;
          }
          this.statsWidgets[mainKey].table.addRow(...cellRow);
          this.statsWidgets[mainKey].box.setContent(this.statsWidgets[mainKey].table);
          break;
        default:
          const tempFormatedObject = FornatedObject[mainKey] as { [key: string]: string | boolean | number; };
          const tempMaxSizes = this.maxSizes[mainKey];
          const keys = Object.keys(tempFormatedObject)
          this.statsWidgets[mainKey].table.clear();
          let s = 0;
          for (let key of keys) {
            const value: string | boolean | number = tempFormatedObject[key];
            const color = typeof value === 'boolean' ? returnBoolColor(value) : 'whiteBright';
            const modifiedValue: string | boolean | number = typeof value === 'boolean' && key == 'refresh rate' ? returnStringIfBool(value, `${settingsContainer.getSetting('gui', 'period')} ms`, `idle`) : `${value}`; 
            const modifiedKey = `${key}${` `.repeat(Math.max(tempMaxSizes[0] - `${key}`.length, 0))}`;
            const cellText = `${` `.repeat(Math.max(tempMaxSizes[1] - `${modifiedValue}`.length, 0))}${modifiedValue}`;
            this.statsWidgets[mainKey].table.addRow(
              { text: modifiedKey, color: 'whiteBright' },
              { text: cellText, color: color }
            );
            s++;
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
        const cellText = { text: value, color: style.color, bold: style.bold, italic: style.italic, dim: style.dim, underline: style.underline, inverse: style.inverse, hidden: style.hidden, strikethrough: style.strikethrough, overline: style.overline};
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