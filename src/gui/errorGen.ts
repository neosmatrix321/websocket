import { InPageWidgetBuilder, SimplifiedStyledElement, Box, KeyListenerArgs } from 'console-gui-tools'
import { getLogLevelColor, getRGBString } from '../global/functions';
import { statsContainer } from '../global/containerWrapper';

interface ErrorDescriptor {
  [key: string]: any;
}

export class ErrorTable {
  errorLogBox: Box;
  detailBox: Box;
  errorTable: InPageWidgetBuilder;
  detailedErrorTable: InPageWidgetBuilder;
  selectedRow: number;
  errorTab: ErrorDescriptor[];
  header: string[];
  maxSizes: number[];
  spacing: number;
  lastErrors: any[];
  active: boolean = false;
  constructor() {
    this.errorLogBox = new Box({
      id: "ErrorLog",
      draggable: true,
      visible: false,
      x: 1,
      y: 1,
      width: (statsContainer.gui.selfStats.width - 2),
      height: 10,
      style: {
        label: "Error Log",
        color: "redBright",
        boxed: true,
      }
    });
    this.errorLogBox.hide();
    this.errorLogBox.removeAllListeners();
    this.detailBox = new Box({
      id: "ErrorDetail",
      draggable: true,
      visible: false,
      x: 1, // Position to the right of your ErrorLog 
      y: this.errorLogBox.content.getViewedPageHeight() + 1,
      width: (statsContainer.gui.selfStats.width - 2),
      height: statsContainer.gui.selfStats.height - this.errorLogBox.content.getViewedPageHeight() - 2,
      style: {
        label: "Error Details",
        color: "cyan",
        boxed: true,
      }
    });
    this.detailBox.removeAllListeners();
    this.detailBox.hide(); // Initially hidden
    this.errorTable = new InPageWidgetBuilder((statsContainer.gui.selfStats.width - 4));
    this.detailedErrorTable = new InPageWidgetBuilder((statsContainer.gui.selfStats.width - 4));
    this.selectedRow = 0;
    this.errorTab = [];
    this.header = [];
    this.maxSizes = [];
    this.spacing = 2;

    this.lastErrors = [];
    this.active = false;
    this.setupErrorLogListeners();
  }
  
  setupErrorLogListeners(): void {
    // this.errorLogBox.on("resize", () => {
    //   this.detailBox.absoluteValues.y = this.errorLogBox.content.getViewedPageHeight() + 1;
    //   this.detailBox.absoluteValues.height = statsContainer.gui.selfStats.height - this.errorLogBox.content.getViewedPageHeight() - 2;
    //   console.info(`ErrorLog resize: ${this.errorLogBox.content.getViewedPageHeight()} | ${this.detailBox.content.getViewedPageHeight()}`);
    // });
    this.errorLogBox.on("keypress", (key: KeyListenerArgs) => {
      // console.info(`ErrorLog keypress: ${key.name} | ${this.errorLogBox.focused} | ${this.errorLogBox.isFocused()} `);
      if (!this.active || !this.errorLogBox.isFocused()) {
        return;
      }
      switch (key.name) {
        case "up":
          if (this.selectedRow > 0) {
            this.selectedRow -= 1
            this.printError();
            // this.detailBox.show();
            this.displayErrorDetails(this.selectedRow);
            // this.detailBox.show();
          }
          break;
        case "down":
          if (this.selectedRow < this.errorTab.length - 1) {
            this.selectedRow += 1;
            this.printError();
            this.displayErrorDetails(this.selectedRow);
            // this.detailBox.show();
            // this.displayErrorDetails(this.errorLogBox.content.scrollIndex);
            // this.detailBox.show();
            // this.detailBox.show();
          }
          break;
        case "return":
          // this.errorLogBox.emit('rowChange', this.errorLogBox.content.scrollIndex);
          if (this.detailBox.visible || !this.detailBox.isVisible()) {
            this.detailBox.hide();
          } else {
            this.displayErrorDetails(this.selectedRow);
            this.detailBox.show();
          }
          break;
      }
      // this.drawErrorTable();
    });
    // this.errorLogBox.on("rowChange", (row: number) => {
    //   this.displayErrorDetails(row);
    //   this.detailBox.show();
    // });
    // this.errorLogBox.on("unfocus", () => {
    //   this.errorLogBox.unfocus();
    //   this.errorLogBox.removeAllListeners();
    //   this.errorLogBox.hide();
    //   this.detailBox.hide();
    // });
  }
  addJsonDetailsToTable(jsonData: any): void {
    const errorDetails = JSON.parse(jsonData);
    if (!errorDetails) return;
    const keys = Object.keys(errorDetails);
    let numRows = Math.ceil(keys.length / 2); // Calculate rows needed

    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < 2; j++) {
        const index = i * 2 + j;
        if (index < keys.length) {
          const key = keys[index];
          const value = jsonData[key];
          this.detailedErrorTable.addRow({ text: `${key}: ${value}`, color: 'whiteBright' });
        }
      }

      // Assuming detailedErrorTable has an addRow method similar to InPageWidgetBuilder
    }
  }

  displayErrorDetails(rowIndex: number) {
    this.detailedErrorTable.clear();
    const selectedError = this.errorTab[rowIndex];
    if (!selectedError) return;

    // Assume your `message` field has the main message, and you have a `json` field 
    const detailMessage = selectedError.message;
    this.detailedErrorTable.addRow({ text: `   ### from: ${selectedError.no} ###`, color: 'cyanBright', bold: true } as SimplifiedStyledElement);
    this.detailedErrorTable.addRow({ text: `Message: ${detailMessage}`, color: 'whiteBright' } as SimplifiedStyledElement);
    try {
      const myJSON = selectedError.json;
      if (!myJSON) throw new Error('No JSON data');
      console.info(`JSON try: ${myJSON}`)

      // this.detailedErrorTable.addRow( // TODO: Add a table for the JSON data
    } catch (error: any) {
      this.detailedErrorTable.addRow({ text: `No JSON data ${error.message}`, color: 'whiteBright' });
    }
    this.detailBox.setContent(this.detailedErrorTable);
  }
  drawErrorTable(): void {
    this.errorTable.clear();
    this.errorTable.addRow(
      ...this.header.map((headerItem, i) => {
        const cellText = `${headerItem}${` `.repeat(Math.max(this.maxSizes[i] - headerItem.length, 0) + this.spacing)}`;
        return { text: cellText, color: 'whiteBright', bold: true } as SimplifiedStyledElement;
      })
    );
    this.errorTab.forEach((row, index) => {
      const background = index === this.selectedRow ? 'bgBlackBright' : undefined;
      this.errorTable.addRow(
        ...this.header.map((headerItem, i) => {
          const cellValue = row[headerItem];
          const color = (headerItem == 'logLevel') ? getRGBString(getLogLevelColor(cellValue)) : 'whiteBright';
          const cellText = `${cellValue}${` `.repeat(Math.max(this.maxSizes[i] - (`${cellValue}`).length, 0) + this.spacing)}`;
          return { text: cellText, color: color, bg: background, bold: true } as SimplifiedStyledElement;
        })
      );
    });
    this.errorLogBox.setContent(this.errorTable);
  }

  updateErrorTable(errorTab: ErrorDescriptor[], header: string[], maxSizes: number[], spacing: number): void {
    this.errorTab = errorTab;
    this.header = header;
    this.maxSizes = maxSizes;
    this.spacing = spacing;
  }

  public printError(): void {
    this.errorTab = [];
    const errorHeader = ['no', 'source', 'logLevel', 'info'];
    const errorMaxSizes = [3, 7, 8, 30]; // Adjust max sizes as needed

    // Populate the ErrorTable (directly from INewErr)
    if (this.lastErrors.length > 0) {
      for (const error of this.lastErrors) {
        this.errorTab.push({
          no: error.counter,
          source: error.mainSource || "NaN",
          logLevel: error.subType || "NaN",
          info: error.message || "NaN",
          message: error.errorEvent.message || "NaN",
          success: error.success ? 'Yes' : 'No',
          json: error.json || '{"info": "No JSON data"}',
        });
      }

      // if (error && typeof error === 'object') {
      this.updateErrorTable(this.errorTab, errorHeader, errorMaxSizes, 2);

      this.drawErrorTable(); // Render the table

      // console.info(`errortable: ${this.errorTable.getViewedPageHeight()} | ${this.errorLogBox.content.getViewedPageHeight()} | errorLogBox: ${this.detailBox.content.getViewedPageHeight()}`);	
    }
  }
  public displayErrorLog(): void {
    if (!this.active) {
      // const p = new ErrorTable(statsContainer.gui.selfStats.width, statsContainer.gui.selfStats.height);
      this.selectedRow = 0;
      // this.errorLogBox.absoluteValues.width = this.gui.Terminal.columns - 2;
      this.errorLogBox.content.clear();
      this.printError();
      this.detailBox.absoluteValues.y = this.errorLogBox.content.getViewedPageHeight() + 3;
      this.detailBox.absoluteValues.height = statsContainer.gui.selfStats.height - this.errorLogBox.content.getViewedPageHeight() - 2;
      // console.info(`ErrorLog resize: ${this.errorLogBox.content.getViewedPageHeight()} | ${this.detailBox.content.getViewedPageHeight()}`);

      this.errorLogBox.show();
      this.errorLogBox.focus();
      this.active = true;
      this.setupErrorLogListeners();
    } else if (this.active) {
      // if (this.errorLogBox.isVisible()) {
      // } else if (this.errorLogBox.isVisible() && !this.errorLogBox.isFocused()) {
      this.active = false;
      this.errorLogBox.removeAllListeners();
      this.detailBox.hide();
      this.errorLogBox.hide();
      // }
    }
  }
}


