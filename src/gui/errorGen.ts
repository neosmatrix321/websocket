import { InPageWidgetBuilder, SimplifiedStyledElement, Box, KeyListenerArgs } from 'console-gui-tools'
import { consoleGui, getRGBString } from './gui';
import { RGB } from 'console-gui-tools/dist/types/components/Utils';
import { IErrorEvent } from '../global/eventInterface';

interface ErrorDescriptor {
  [key: string]: any;
}

export class ErrorTable {
  selectedRow: number;
  errorTab: ErrorDescriptor[];
  header: string[];
  errorTable: InPageWidgetBuilder;
  detailedErrorTable: InPageWidgetBuilder;
  maxSizes: number[];
  spacing: number;
  box: Box;
  lastErrors: any[];
  detailBox: Box;
  active: boolean = false;

  constructor(width: number, height: number) {
    this.selectedRow = 0;
    this.errorTab = [];
    this.header = [];
    this.maxSizes = [];
    this.spacing = 2;
    this.errorTable = new InPageWidgetBuilder((width - 4));
    this.detailedErrorTable = new InPageWidgetBuilder((width - 4));

    this.lastErrors = [];
    this.box = new Box({
      id: "ErrorLog",
      draggable: false,
      visible: false,
      x: 1,
      y: 1,
      width: (width - 2),
      height: 10,
      style: {
        label: "Error Log",
        color: "redBright",
        boxed: true,
      }
    });
    this.box.hide();
    this.detailBox = new Box({
      id: "ErrorDetail",
      draggable: false,
      visible: false,
      x: 1, // Position to the right of your ErrorLog 
      y: 12,
      width:(width - 2),
      height: height - this.box.content.getViewedPageHeight() - 14,
      style: {
        label: "Error Details",
        color: "cyan",
        boxed: true,
      }
    });
    this.detailBox.hide(); // Initially hidden
    this.active = false;
    this.setupErrorLogListeners();
  }
  setupErrorLogListeners(): void {
    this.box.on("keypress", (key: KeyListenerArgs) => {
      // console.info(`ErrorLog keypress: ${key.name} | ${this.box.focused} | ${this.box.isFocused()} `);
      if (!this.active || !this.box.isFocused()) {
        return;
      }
      switch (key.name) {
        case "up":
          if (this.selectedRow > 0) {
            this.selectedRow -= 1
            this.printError();
            // this.detailBox.show();
          }
          break
        case "down":
          if (this.selectedRow < this.errorTab.length - 1) {
            this.selectedRow += 1
            this.printError();
            // this.detailBox.show();
          }
          break
        case "return":
          this.box.emit('rowChange', this.selectedRow);
          break;
      }
      // this.drawErrorTable();
    });
    this.box.on("rowChange", (row: number) => {
      this.displayErrorDetails(row);
      this.detailBox.show();
    });
    // this.box.on("unfocus", () => {
    //   this.box.unfocus();
    //   this.box.removeAllListeners();
    //   this.box.hide();
    //   this.detailBox.hide();
    // });
  }
  addJsonDetailsToTable(jsonData: any) {
    const errorDetails = JSON.parse(jsonData);
    if (!errorDetails) return;
    const keys = Object.keys(errorDetails);
    let numRows = Math.ceil(keys.length / 2); // Calculate rows needed

    for (let i = 0; i < numRows; i++) {
      const rowData = [];
      for (let j = 0; j < 2; j++) {
        const index = i * 2 + j;
        if (index < keys.length) {
          const key = keys[index];
          const value = jsonData[key];
          rowData.push({ text: `${key}: ${value}`, color: getRGBString("whiteBright") });
        }
      }

      // Assuming detailedErrorTable has an addRow method similar to InPageWidgetBuilder
      return { ...rowData };
    }
  }

  displayErrorDetails(rowIndex: number) {
    this.detailedErrorTable.clear();
    const selectedError = this.errorTab[rowIndex];
    if (!selectedError) return;

    // Assume your `message` field has the main message, and you have a `json` field 
    const detailMessage = selectedError.message;
    this.detailedErrorTable.addRow({ text: `   ### from: ${selectedError.no} ###`, color: getRGBString("cyanBright"), bold: true } as SimplifiedStyledElement);
    this.detailedErrorTable.addRow({ text: `Message: ${detailMessage}`, color: getRGBString("whiteBright") } as SimplifiedStyledElement);
    try {
      const myJSON = selectedError.json;
      if (!myJSON) throw new Error('No JSON data');
      console.info(`JSON try: ${myJSON}`)
      const detailText = this.addJsonDetailsToTable(myJSON);
        if (!detailText) throw new Error('addJsonDetailsToTable error');
        this.detailedErrorTable.addRow(...detailText);
      

      // this.detailedErrorTable.addRow( // TODO: Add a table for the JSON data
    } catch (error: any) {
      this.detailedErrorTable.addRow({ text: `No JSON data ${error.message}`, color: getRGBString("whiteBright") });
    }
    this.detailBox.setContent(this.detailedErrorTable);
  }
  drawErrorTable(): void {
    this.errorTable.clear();
    this.errorTable.addRow(
      ...this.header.map((headerItem, i) => {
        const cellText = `${headerItem}${` `.repeat(Math.max(this.maxSizes[i] - headerItem.length, 0) + this.spacing)}`;
        return { text: cellText, color: getRGBString("whiteBright"), bold: true } as SimplifiedStyledElement;
      })
    );
    this.errorTab.forEach((row, index) => {
      const background = index === this.selectedRow ? 'bgBlackBright' : undefined;
      this.errorTable.addRow(
        ...this.header.map((headerItem, i) => {
          const cellValue = row[headerItem];
          const color = (headerItem == 'logLevel') ? getRGBString(this.getLogLevelColor(cellValue)) : getRGBString("whiteBright");
          const cellText = `${cellValue}${` `.repeat(Math.max(this.maxSizes[i] - (`${cellValue}`).length, 0) + this.spacing)}`;
          return { text: cellText, color: color, bg: background, bold: true } as SimplifiedStyledElement;
        })
      );
    });
    this.box.setContent(this.errorTable);
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

      // console.info(`errortable: ${this.errorTable.getViewedPageHeight()} | ${this.box.content.getViewedPageHeight()} | box: ${this.detailBox.content.getViewedPageHeight()}`);	
    }
  }
  public displayErrorLog(): void {
    if (!this.active) {
      // const p = new ErrorTable(this.gui.Screen.width, this.gui.Screen.height);
      this.selectedRow = 0;
      // this.box.absoluteValues.width = this.gui.Terminal.columns - 2;
      this.box.content.clear();
      this.printError();
      this.box.show();
      this.box.focus();
      this.active = true;
      this.setupErrorLogListeners();
  } else if (this.active) {
    // if (this.box.isVisible()) {
    // } else if (this.box.isVisible() && !this.box.isFocused()) {
      this.active = false;
      this.box.removeAllListeners();
      this.detailBox.hide();
      this.box.hide();
    // }
  }
}
  getLogLevelColor(logLevel: string): string {
    switch (logLevel) {
      case 'DEBUG':
        return `magentaBright`;
      case 'ERROR':
        return `red`;
      case 'WARNING':
        return 'yellow';
      case 'INFO':
        return "cyan";
      default:
        return `yellow`;
    }
  }
}


