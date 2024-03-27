import { RGB, SimplifiedStyledElement } from "console-gui-tools/dist/types/components/Utils";
import { ForegroundColorName } from 'chalk';

export function M(color: string, bg: string, bold: boolean = true, italic: boolean = false): any {
  return { text: `-`, color: color, bg: bg, bold: bold, italic: italic };
}

export function D(color: string, bg: string, underline: boolean = false, bold: boolean = false): any {
  return { text: `#`, color: color, bg: bg, underline: underline, bold: bold };
}


export function sSTR(spaceCount: number = 1): string {
  return ' '.repeat(spaceCount);
}
export function sOBJ(spaceCount: number = 1) {
  return { text: ' '.repeat(spaceCount) }
};

export function printAliveStatus(success: boolean): SimplifiedStyledElement {
  if (!success) {
    return { text: `false`, color: 'red', bg: 'bgBlack', bold: true };
  } else {
    return { text: `true`, color: 'green', bg: 'bgBlack', bold: true };
  }
}

export function returnStringIfBool(value: boolean, trueValue: string, falseValue?: string): string {
  if (!falseValue) falseValue = trueValue;

  return value ? `${trueValue}` : `${falseValue}`;
}

export function returnBoolColor(value: boolean | string, defaultColor: ForegroundColorName = 'whiteBright' ): ForegroundColorName {
  const color = typeof value === 'boolean' ? (value ? 'greenBright' : 'redBright') : defaultColor;
  return color;
}

export function printGuiAliveStatus(success: boolean, altValue: string): SimplifiedStyledElement {
  if (success) {
    return { text: `${altValue}`, color: 'green', bg: 'bgBlack', bold: true };
  } else {
    return { text: `${altValue}`, color: 'red', bg: 'bgBlack', bold: true };
  }
}

export function calcDuration(timestamp: number): string {
  const hours = Math.floor(timestamp / 3600);
  const minutes = Math.floor((timestamp % 3600) / 60);
  const seconds = Math.floor(timestamp % 60);
  return `${hours}:${minutes}:${seconds}`;
}

export function calcDurationDetailed(duration: number): string {
  if (isNaN(duration) || !(duration > 1)) {
    return "NaN";
  }
  const milliseconds = Math.floor((duration % 1000));
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  let durationSTR = '';
  let count = 0;

  if (days > 0 && days < 365) {
    durationSTR += `${days.toString().padStart(1, '0')}d `;
    count++;
    if (count >= 2) return durationSTR.trim();
  }
  if (hours > 0) {
    durationSTR += `${hours.toString().padStart(2, '0')}h `;
    count++;
    if (count >= 2) return durationSTR.trim();
  }
  if (minutes > 0) {
    durationSTR += `${minutes.toString().padStart(2, '0')}m `;
    count++;
    if (count >= 2) return durationSTR.trim();
  }
  if (seconds >= 0) {
    durationSTR += `${seconds.toString().padStart(2, '0')}s `;
    count++;
    if (count >= 2) return durationSTR.trim();
  }
  if (milliseconds >= 0) {
    durationSTR += `${milliseconds.toString().padStart(3, '0')}ms`;
  }
  return durationSTR.trim();
}

export function calcTimeDetailed(duration: number): string {
  if (isNaN(duration) || !(duration > 1)) {
    return "NaN";
  }
  const milliseconds = Math.floor((duration % 1000));
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  let durationSTR = '';
  durationSTR += `${hours.toString().padStart(2, '0')}:`;
  durationSTR += `${minutes.toString().padStart(2, '0')}:`;
  durationSTR += `${seconds.toString().padStart(2, '0')}:`;
  durationSTR += `${milliseconds.toString().padStart(3, '0')}ms`;

  return durationSTR;
}

export function convertTimestampToTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function safeStringify(obj: any, maxDepth = 4, space: string | number = ''): string {
  const cache = new WeakSet(); // Use a WeakSet to handle circular references
  let depth = 0;

  return JSON.stringify(obj, (key, value) => {
    const type = typeof key;
    if (type && typeof value === 'object' && value !== null) {
      if (cache.has(value)) return;
      cache.add(value);

      if (depth > maxDepth) {
        return `[DEPTH LIMIT REACHED]: ${maxDepth}`; // Indicate depth limit
      }
      depth++;

      // Optionally try to get a custom string representation
      if (typeof value !== 'object' && typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
        return value.toString();
      }
    }
    return typeof value === 'function' ? value.toString() : value;
  }, space);
}

export function getLogLevelColor(logLevel: string): string {
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

export interface ColorRow {
  text: string;
  color: RGB;
  bold?: boolean;
}

export function columnWrapper(text: string, color: ForegroundColorName = "white"): SimplifiedStyledElement {
  return { text: text, color: color, bold: true };
}

export function columnWrapperText(text: string, color: RGB = getRGBString('default')): SimplifiedStyledElement {
  return { text: text, color: color, bold: true };
}


export function getRGBString(colorName: string): RGB {
  const color = COLORS[colorName] || COLORS.default; // Falls 'colorName' nicht existiert, verwende den Default.
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

export const COLORS: Record<string, number[]> =
{
  "default": [245, 245, 245],
  "bgDefault": [0, 0, 0],
  "black": [0, 0, 0],
  "blackBright": [29, 29, 29],
  "blue": [0, 0, 255],
  "blueBright": [70, 130, 180],
  "cyan": [0, 255, 255],
  "cyanBright": [224, 255, 255],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenBright": [144, 238, 144],
  "yellow": [255, 255, 0],
  "yellowBright": [255, 255, 224],
  "magenta": [255, 0, 255],
  "magentaBright": [255, 0, 255],
  "red": [255, 0, 0],
  "redBright": [255, 69, 0],
  "white": [235, 235, 235],
  "whiteBright": [255, 255, 255],
  "bgBlack": [0, 0, 0],
  "bgBlackBright": [29, 29, 29],
  "bgBlue": [0, 0, 255],
  "bgBlueBright": [70, 130, 180],
  "bgCyan": [0, 255, 255],
  "bgCyanBright": [224, 255, 255],
  "bgGray": [128, 128, 128],
  "bgGreen": [0, 128, 0],
  "bgGreenBright": [144, 238, 144],
  "bgYellow": [255, 255, 0],
  "bgYellowBright": [255, 255, 224],
  "bgMagenta": [255, 0, 255],
  "bgMagentaBright": [255, 0, 255],
  "bgRed": [255, 0, 0],
  "bgRedBright": [255, 69, 0],
  "bgWhite": [235, 235, 235],
  "bgWhiteBright": [255, 255, 255],
}


export function createRow(...columns: string[]): string {
  return columns.map(column => {
    if (column) {
      const parts = column.split(':');
      const key = parts[0];
      const value = parts.length > 1 ? parts[1] : '';
      const totalPadding = Math.max(0, 18 - key.length - value.length);
      return `${key}:${' '.repeat(totalPadding)}${value}`;
    }
    return '';
  }).join(' | ');
}
