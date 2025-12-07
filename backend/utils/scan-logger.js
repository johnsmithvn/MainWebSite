// 📁 backend/utils/scan-logger.js
// 📝 Centralized scan logging system for all content types

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class ScanLogger {
  constructor(type, dbkey) {
    this.type = type; // 'manga', 'movie', 'music', 'media'
    this.dbkey = dbkey;
    this.scanId = this.generateScanId();
    this.logFile = this.getLogFilePath();
    this.startTime = Date.now();
    this.events = [];
    this.errors = [];
    this.warnings = [];
    
    this.stats = {
      totalFolders: 0,
      scannedFolders: 0,
      skippedFolders: 0,
      totalFiles: 0,
      scannedFiles: 0,
      failedFiles: 0,
      addedItems: 0,
      updatedItems: 0,
      deletedItems: 0
    };
    
    this.checkpoint = {
      lastPath: '',
      scannedCount: 0
    };
    
    // Write initial log
    this.logStart();
  }

  generateScanId() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('.')[0];
    return `scan_${this.type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getLogFilePath() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return path.join(LOG_DIR, `scan_${this.type}_${dateStr}_${timeStr}.log`);
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    this.events.push(logEntry);

    // Track errors/warnings separately
    if (level === 'error') {
      this.errors.push({ timestamp, message, ...data });
    } else if (level === 'warn') {
      this.warnings.push({ timestamp, message, ...data });
    }

    // Write to file immediately (streaming)
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${data.path ? ` - ${data.path}` : ''}${data.error ? ` (${data.error})` : ''}\n`;
    fs.appendFileSync(this.logFile, logLine, 'utf8');

    // Also console log for real-time monitoring
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(`[${this.type}] ${message}`, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  logStart() {
    this.info('Scan started', {
      scanId: this.scanId,
      type: this.type,
      dbkey: this.dbkey,
      logFile: this.logFile
    });
  }

  updateStats(updates) {
    Object.assign(this.stats, updates);
  }

  updateCheckpoint(path, count) {
    this.checkpoint.lastPath = path;
    this.checkpoint.scannedCount = count;
    this.debug('Checkpoint updated', { path, count });
  }

  logFolder(action, folderPath, data = {}) {
    this.info(`Folder ${action}`, { path: folderPath, ...data });
    
    if (action === 'scanned') {
      this.stats.scannedFolders++;
    } else if (action === 'skipped') {
      this.stats.skippedFolders++;
    }
  }

  logFile(action, filePath, data = {}) {
    this.debug(`File ${action}`, { path: filePath, ...data });
    
    if (action === 'scanned') {
      this.stats.scannedFiles++;
    } else if (action === 'failed') {
      this.stats.failedFiles++;
      this.error(`File scan failed`, { path: filePath, ...data });
    }
  }

  logProgress(current, total, currentPath = '') {
    const percentage = total > 0 ? ((current / total) * 100).toFixed(2) : 0;
    this.info('Scan progress', {
      current,
      total,
      percentage: `${percentage}%`,
      currentPath
    });
  }

  logComplete() {
    const duration = Date.now() - this.startTime;
    const endTime = new Date().toISOString();
    
    this.info('Scan completed', {
      duration: `${(duration / 1000).toFixed(2)}s`,
      stats: this.stats
    });

    // Write final summary to file
    const summary = this.generateSummary(duration, endTime);
    fs.appendFileSync(this.logFile, '\n' + summary + '\n', 'utf8');

    return {
      scanId: this.scanId,
      logFile: this.logFile,
      duration,
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  logError(error, context = {}) {
    this.error(`Scan error: ${error.message}`, {
      error: error.stack,
      ...context
    });
  }

  generateSummary(duration, endTime) {
    const lines = [
      '='.repeat(80),
      'SCAN SUMMARY',
      '='.repeat(80),
      `Scan ID: ${this.scanId}`,
      `Type: ${this.type}`,
      `Database: ${this.dbkey}`,
      `Start Time: ${new Date(this.startTime).toISOString()}`,
      `End Time: ${endTime}`,
      `Duration: ${(duration / 1000).toFixed(2)} seconds`,
      '',
      'STATISTICS:',
      `  Total Folders: ${this.stats.totalFolders}`,
      `  Scanned Folders: ${this.stats.scannedFolders}`,
      `  Skipped Folders: ${this.stats.skippedFolders}`,
      `  Total Files: ${this.stats.totalFiles}`,
      `  Scanned Files: ${this.stats.scannedFiles}`,
      `  Failed Files: ${this.stats.failedFiles}`,
      `  Added Items: ${this.stats.addedItems}`,
      `  Updated Items: ${this.stats.updatedItems}`,
      `  Deleted Items: ${this.stats.deletedItems}`,
      '',
      `ERRORS: ${this.errors.length}`,
      `WARNINGS: ${this.warnings.length}`,
      '',
      'CHECKPOINT:',
      `  Last Path: ${this.checkpoint.lastPath}`,
      `  Scanned Count: ${this.checkpoint.scannedCount}`,
      '='.repeat(80)
    ];

    if (this.errors.length > 0) {
      lines.push('', 'ERROR DETAILS:');
      this.errors.forEach((err, idx) => {
        lines.push(`  ${idx + 1}. ${err.message} - ${err.path || 'N/A'}`);
        if (err.error) {
          lines.push(`     Error: ${err.error}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      lines.push('', 'WARNING DETAILS:');
      this.warnings.forEach((warn, idx) => {
        lines.push(`  ${idx + 1}. ${warn.message} - ${warn.path || 'N/A'}`);
      });
    }

    return lines.join('\n');
  }

  // Static method to get recent logs
  static getRecentLogs(type, limit = 10) {
    try {
      const files = fs.readdirSync(LOG_DIR)
        .filter(f => f.startsWith(`scan_${type}_`) && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(LOG_DIR, f),
          mtime: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit);

      return files.map(f => ({
        filename: f.name,
        path: f.path,
        timestamp: new Date(f.mtime).toISOString()
      }));
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  // Static method to read log file
  static readLogFile(filename) {
    try {
      const filePath = path.join(LOG_DIR, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error('Log file not found');
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading log file:', error);
      throw error;
    }
  }

  // Static method to cleanup old logs (older than N days)
  static cleanupOldLogs(daysToKeep = 30) {
    try {
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert days to ms

      const files = fs.readdirSync(LOG_DIR)
        .filter(f => f.startsWith('scan_') && f.endsWith('.log'));

      let deletedCount = 0;
      files.forEach(file => {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted old log: ${file}`);
        }
      });

      return { deletedCount, totalFiles: files.length };
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      throw error;
    }
  }
}

module.exports = ScanLogger;
