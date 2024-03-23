import { Box, InPageWidgetBuilder, KeyListenerArgs, SimplifiedStyledElement } from "console-gui-tools";
import { statsContainer } from "../global/containerWrapper";
import { IFormatedLastUpdates } from "../stats/statsInstance";

export interface LastUpdatesDescriptor {
  [key: string]: any;
}

export class displayLastUpdates {
  selectedRow: number = 0;
  lastUpdateBox: Box;
  lastUpdatesTable: InPageWidgetBuilder;
  lastUpdatesTab: IFormatedLastUpdates;
  header: string[] = ["cat", "function", "lastUpdate", "idleTime", "no", "success"];
  maxSizes: number[] = [10, 25, 15, 10, 5, 5]	;
  spacing: number;
  active: boolean = false;
  protected width: number;
  protected height: number;
  constructor() {
    this.width = statsContainer.gui.selfStats.width;
    this.height = statsContainer.gui.selfStats.height;
    this.lastUpdateBox = new Box({
      id: "LastUpdates",
      draggable: false,
      visible: false,
      x: 1,
      y: 1,
      width: 90,
      height: (this.height - 2),
      style: {
        label: "Last Updates",
        color: "blackBright",
        boxed: true,
      }
    });
    this.lastUpdateBox.hide();
    this.lastUpdatesTable = new InPageWidgetBuilder((this.width - 4));
    this.lastUpdatesTab = statsContainer.getFormatedLastUpdates();
    ;
    this.spacing = 2;
    this.setupErrorLogListeners();
  }

  setupErrorLogListeners(): void {
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
    this.lastUpdatesTable.addRow(
      ...this.header.map((headerItem, i) => {
        const cellText = `  ${headerItem}${` `.repeat(Math.max(this.maxSizes[i] - headerItem.length - 2, 0) + this.spacing)}`;
        return { text: cellText, color: 'magentaBright', bg: 'bgBlack', bold: true, italic: false, inverse: false } as SimplifiedStyledElement;
      })
    );
    this.lastUpdatesTab.forEach((row: { cat: string, function: string, lastUpdate: string, idleTime: string, no: number, success: boolean, [key: string]: any }, index: number) => {
      const background = index % 2 !== 0 ? 'bgBlackBright' : index === this.selectedRow ? 'bgGray' : 'bgBlack';
      this.lastUpdatesTable.addRow(
        ...this.header.map((headerItem: string, i: number) => {
          const overrideBG = headerItem == 'success' ? 'bgBlack' : background;
          const cellValue = row[headerItem];
          const color = headerItem == 'success' && row[headerItem] === true ? 'greenBright' : headerItem == 'success' && row[headerItem] === false ? 'redBright' : 'whiteBright';
          const tempText = (
            (headerItem != 'cat') || (
              (headerItem == 'cat') && (
                (row['cat'] == 'main' && row['function'] == 'init') ||
                (row['cat'] == 'gui' && row['function'] == 'start') ||
                (row['cat'] == 'global' && row['function'] == 'initStats') ||
                (row['cat'] == 'server' && row['function'] == 'createServer') ||
                (row['cat'] == 'clients' && row['function'] == 'statsUpdated')
              )
            )
          ) ? `${cellValue}` : ` └─> `;

          const cellText = ` ${tempText}${` `.repeat(Math.max(this.maxSizes[i] - (`${tempText}`).length - 1, 0) + this.spacing)}`;
          const inverse = index === this.selectedRow ? true : false;
          // const inverse = index % 2 !== 0 ? true : false;
          return { text: cellText, color: color, bg: overrideBG, bold: false, inverse: inverse } as SimplifiedStyledElement;
        })
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
    // The sum of all numbers is 75
    this.updateLastUpdatesTable(LastUpdates);
    this.drawLastUpdates();
  }

  public displayLastUpdates() {
    if (!this.active) {
      this.selectedRow = 0;
      this.lastUpdateBox.content.clear();
      this.printLastUpdates();
      this.lastUpdateBox.show();
      this.lastUpdateBox.focus();
      this.active = true;
    } else {
      this.lastUpdateBox.removeAllListeners();
      this.lastUpdateBox.hide();
      this.active = false;
    }
  }
}
