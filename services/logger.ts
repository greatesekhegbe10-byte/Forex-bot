
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    // Add to internal buffer
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Output to console with styling
    const prefix = `[${level} - ${new Date().toLocaleTimeString()}]`;
    const style = 
      level === LogLevel.ERROR ? 'color: #ef4444; font-weight: bold;' :
      level === LogLevel.WARN ? 'color: #f59e0b; font-weight: bold;' :
      level === LogLevel.INFO ? 'color: #3b82f6;' : 'color: #94a3b8;';

    console.log(`%c${prefix} ${message}`, style, data || '');
  }

  info(message: string, data?: any) { this.log(LogLevel.INFO, message, data); }
  warn(message: string, data?: any) { this.log(LogLevel.WARN, message, data); }
  error(message: string, data?: any) { this.log(LogLevel.ERROR, message, data); }
  debug(message: string, data?: any) { this.log(LogLevel.DEBUG, message, data); }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
