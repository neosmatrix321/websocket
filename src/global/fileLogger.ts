import fs from 'fs';
import { INewErr } from './eventInterface';

class Logger {
  private logFilePath: string;

  constructor(timestamp: string) {
    // Ensure the log directory exists
    this.logFilePath = `./logs/${timestamp}/`;
    if (!fs.existsSync(this.logFilePath)) {
      fs.mkdirSync(this.logFilePath, { recursive: true });
    }
  }

  log(no: number, mainSource: string, subType: string, message: string) {
    const logFile = `${this.logFilePath}${no}-${mainSource}_${subType}.log`;
    fs.appendFileSync(logFile, `${message}`);
  }

  logError(error: INewErr) {
    this.log(error.counter, error.mainSource, error.subType, `### Error no: ${error.counter} # ${new Date().toISOString()} ###\n\n`);
    this.log(error.counter, error.mainSource, error.subType, `Source: ${error.mainSource}\nsubType: ${error.subType} | Info: ${error.message}\nsuccess: ${error.success}\n\nError: ${error.errorEvent.name}\nMessage: ${error.errorEvent.message}\nStacktrace: ${error.errorEvent.stack}\n\n`
    );
    const myDebugEvent = error.debugEvent;
    if (myDebugEvent) {
      this.log(error.counter, error.mainSource, error.subType, `Debug: ${JSON.stringify(myDebugEvent, null, 2)}\n\n`);
    }
    if (error.json) {
      this.log(error.counter, error.mainSource, error.subType, `JSON: ${error.json}`);
    }
  }
}

export default Logger; 
