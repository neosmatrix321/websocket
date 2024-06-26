import { Box, InPageWidgetBuilder, KeyListenerArgs, SimplifiedStyledElement } from "console-gui-tools";
import { statsContainer } from "../global/containerWrapper";
import { IFormatedLastUpdates } from "../global/statsInstance";
import { sOBJ, sSTR } from "../global/functions";

export interface LastUpdatesDescriptor {
  [key: string]: any;
}

export class displayLastUpdates {
  selectedRow: number = 0;
  lastUpdateBox: Box;
  lastUpdatesTable: InPageWidgetBuilder;
  lastUpdatesTab: IFormatedLastUpdates;
  header: string[] = ["cat", "function", "lastUpdate", "idleTime", "no", "result"];
  maxSizes: number[] = [9, 25, 12, 15, 8, 3]; // TODO: FAKE 2 as rest of table?
  spacing: number;
  active: boolean = false;
  constructor() {
    this.lastUpdateBox = new Box({
      id: "LastUpdates",
      draggable: false,
      visible: false,
      x: 1,
      y: 1,
      width: 77,
      height: (statsContainer.gui.selfStats.height - 2),
      style: {
        label: "Last Updates",
        color: "blackBright",
        boxed: true,
      }
    });
    this.lastUpdateBox.hide();
    this.lastUpdatesTable = new InPageWidgetBuilder((statsContainer.gui.selfStats.width - 4));
    this.lastUpdatesTab = statsContainer.getFormatedLastUpdates();
    ;
    this.spacing = 2;
  }

  setupLastUpdatesListeners(): void {
    this.lastUpdateBox.on("keypress", (key: KeyListenerArgs) => {
      if (!this.active || !this.lastUpdateBox.isFocused()) {
        return;
      }
      switch (key.name) {
        case "up":
          if (this.selectedRow > 0) {
            this.selectedRow -= 1
            this.printLastUpdates();
            // this.detailBox.show();
          }
          break
        case "down":
          if (this.selectedRow < this.lastUpdatesTab.length - 1) {
            this.selectedRow += 1
            this.printLastUpdates();
            // this.detailBox.show();
          }
          break
        case "return":
          this.lastUpdateBox.emit('rowChange', this.selectedRow);
          break;
      }
      // this.drawErrorTable();
    });
    // this.lastUpdateBox.on("rowChange", (row: number) => {
    //   this.displayErrorDetails(row);
    //   // this.detailBox.show();
    // });
  }




  drawLastUpdates(): void {
    this.lastUpdatesTable.clear();
    this.lastUpdatesTable.addRow(sOBJ(1),
      ...this.header.map((headerItem, i) => {
        const key = (headerItem == 'result') ? '?' : headerItem;
        const cellText = `${sSTR(1)}${key}${` `.repeat(Math.max(this.maxSizes[i] - key.length - this.spacing, 0))}${sSTR(1)}`;
        return { text: cellText, color: 'magentaBright', bg: 'bgBlack', bold: true, italic: false, inverse: false } as SimplifiedStyledElement;
      }), { text: ` ` } 
    );
    this.lastUpdatesTab.forEach((row: { cat: string, function: string, lastUpdate: string, idleTime: string, no: number, result: boolean, [key: string]: any }, index: number) => {
      const background = index % 2 !== 0 ? 'bgBlackBright' : index === this.selectedRow ? 'bgGray' : 'bgBlack';
      this.lastUpdatesTable.addRow(sOBJ(1),
        ...this.header.map((headerItem: string, i: number) => {
          const overrideBG = headerItem == 'result' ? 'bgBlack' : background;
          const cellValue = (headerItem == 'result') ? ((row[headerItem]) ? '+' : "-") : row[headerItem];
          const color = headerItem == 'result' && row[headerItem] === true ? 'greenBright' : headerItem == 'result' && row[headerItem] === false ? 'redBright' : 'whiteBright';
          const tempText = (
            (i === 0) && (
              (row['cat'] == 'main' && row['function'] != 'init') ||
              (row['cat'] == 'gui' && row['function'] != 'start') ||
              (row['cat'] == 'global' && row['function'] != 'initStats') ||
              (row['cat'] == 'server' && row['function'] != 'createServer') ||
              (row['cat'] == 'clients' && row['function'] != 'statsUpdated')
            )
          ) ? ` └─> ` : `${cellValue}`;

          const cellText = (headerItem == 'cat' || headerItem == 'function') ? `${sSTR(1)}${tempText}${` `.repeat(Math.max(this.maxSizes[i] - (`${tempText}`).length - this.spacing, 0))}${sSTR(1)}` : `${sSTR(1)}${` `.repeat(Math.max(this.maxSizes[i] - (`${tempText}`).length - this.spacing, 0))}${tempText}${sSTR(1)}`;
          const inverse = index === this.selectedRow ? true : false;
          // const inverse = index % 2 !== 0 ? true : false;
          return { text: cellText, color: color, bg: overrideBG, bold: false, inverse: inverse } as SimplifiedStyledElement;
        }), { text: ` `, bg: background}
      );
      // console.log(`row: ${index} - ${row['cat']} - ${background}`)
    });
    this.lastUpdateBox.setContent(this.lastUpdatesTable);
  }

  updateLastUpdatesTable(lastUpdatesTab: IFormatedLastUpdates): void {
    this.lastUpdatesTab = lastUpdatesTab;
  }

  public printLastUpdates() {
    const LastUpdates = statsContainer.getFormatedLastUpdates();
    // The sum of ALL numbers is 75
    this.updateLastUpdatesTable(LastUpdates);
    this.drawLastUpdates();
  }

  public displayLastUpdates() {
    if (!this.active) {
      this.selectedRow = 0;
      this.lastUpdateBox.content.clear();
      this.printLastUpdates();
      this.lastUpdateBox.show();
      this.setupLastUpdatesListeners();
      this.lastUpdateBox.focus();
      this.active = true;
    } else {
      this.lastUpdateBox.removeAllListeners();
      this.lastUpdateBox.hide();
      this.active = false;
    }
  }
}
