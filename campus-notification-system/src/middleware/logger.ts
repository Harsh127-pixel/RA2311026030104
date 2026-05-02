/**
 * Use Logger instead of console.log everywhere.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

class LoggingMiddleware {
  private static instance: LoggingMiddleware;
  private logHistory: LogEntry[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';

  private colors = {
    INFO: '\x1b[34m',    // Blue
    WARN: '\x1b[33m',    // Yellow
    ERROR: '\x1b[31m',   // Red
    DEBUG: '\x1b[90m',   // Gray
    SUCCESS: '\x1b[32m', // Green
    RESET: '\x1b[0m',
  };

  private constructor() {}

  public static getInstance(): LoggingMiddleware {
    if (!LoggingMiddleware.instance) {
      LoggingMiddleware.instance = new LoggingMiddleware();
    }
    return LoggingMiddleware.instance;
  }

  private mapContextToPackage(context: string): 'component' | 'hook' | 'page' | 'state' | 'middleware' {
    const ctx = context.toLowerCase();
    // Hook detection (standard 'use' prefix)
    if (ctx.startsWith('use') || ctx.includes('hook')) return 'hook';
    // Page detection
    if (ctx.includes('page') || ctx.includes('view') || ctx === 'dashboard') return 'page';
    // Component detection
    if (ctx.includes('card') || ctx.includes('component') || ctx.includes('feed') || ctx.includes('inbox')) return 'component';
    if (ctx.includes('store') || ctx.includes('context') || ctx.includes('state')) return 'state';
    return 'middleware';
  }

  private async postToRemote(level: LogLevel, context: string, message: string) {
    const token = process.env.NEXT_PUBLIC_AUTH_TOKEN;
    if (!token) return;

    try {
      const levelMap: Record<LogLevel, string> = {
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
        SUCCESS: 'info',
      };
      const remoteLevel = levelMap[level] ?? 'info';

      const remotePackage = this.mapContextToPackage(context);

      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stack: 'frontend',
          level: remoteLevel,
          package: remotePackage,
          message: `[${context}] ${message}`.slice(0, 48),
        }),
      }).catch(() => {
      });
    } catch {
      // Catch synchronous errors
    }
  }

  private log(level: LogLevel, context: string, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };

    this.logHistory.push(entry);

    // Fire-and-forget remote logging
    this.postToRemote(level, context, message);

    if (this.isDevelopment) {
      const color = this.colors[level] || this.colors.RESET;
      const reset = this.colors.RESET;
      
      const logString = `[${entry.timestamp}] ${color}${level}${reset} [${context}] ${message}`;
      
      console.info(logString, data ?? '');
    }
  }

  public info(context: string, message: string, data?: unknown) {
    this.log('INFO', context, message, data);
  }

  public warn(context: string, message: string, data?: unknown) {
    this.log('WARN', context, message, data);
  }

  public error(context: string, message: string, data?: unknown) {
    this.log('ERROR', context, message, data);
  }

  public debug(context: string, message: string, data?: unknown) {
    this.log('DEBUG', context, message, data);
  }

  public success(context: string, message: string, data?: unknown) {
    this.log('SUCCESS', context, message, data);
  }

  public getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  public clearHistory() {
    this.logHistory = [];
  }
}

const Logger = LoggingMiddleware.getInstance();
export { Logger };
export default LoggingMiddleware;
