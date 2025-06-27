#!/usr/bin/env bun
/**
 * Connection Pool Monitoring Script
 * 
 * Use this to monitor database connection pool usage
 * and verify the singleton pattern is working correctly.
 */

import { getPool, getPoolInfo } from '@/lib/db';
import * as mysql from 'mysql2/promise';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkDatabaseConnections() {
  try {
    // Direct MySQL connection to check process list
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'information_schema'
    });

    const [processes] = await connection.execute<any[]>(
      `SELECT 
        ID, 
        USER, 
        HOST, 
        DB, 
        COMMAND, 
        TIME, 
        STATE 
      FROM processlist 
      WHERE DB = ? 
      ORDER BY TIME DESC`,
      [process.env.DB_NAME || 'blindscommerce_test']
    );

    await connection.end();
    return processes;
  } catch (error) {
    console.error('Error checking connections:', error);
    return [];
  }
}

async function monitorPool() {
  console.log(`${colors.cyan}=== BlindsCommerce Connection Pool Monitor ===${colors.reset}\n`);
  console.log(`Database: ${process.env.DB_NAME || 'blindscommerce_test'}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Get pool info
  const pool = await getPool();
  const poolInfo = await getPoolInfo();
  
  if (poolInfo) {
    console.log(`${colors.blue}Pool Configuration:${colors.reset}`);
    console.log(`  Connection Limit: ${poolInfo.total}`);
    console.log(`  Active Connections: ${poolInfo.used}`);
    console.log(`  Free Connections: ${poolInfo.free}`);
    console.log(`  Queued Requests: ${poolInfo.queued}\n`);

    // Color code the status
    let statusColor = colors.green;
    let status = 'HEALTHY';
    
    if (poolInfo.used > poolInfo.total * 0.8) {
      statusColor = colors.red;
      status = 'CRITICAL';
    } else if (poolInfo.used > poolInfo.total * 0.6) {
      statusColor = colors.yellow;
      status = 'WARNING';
    }

    console.log(`${colors.blue}Pool Status:${colors.reset} ${statusColor}${status}${colors.reset}`);
    console.log(`${colors.blue}Usage:${colors.reset} ${statusColor}${Math.round((poolInfo.used / poolInfo.total) * 100)}%${colors.reset}\n`);
  }

  // Get actual MySQL processes
  const processes = await checkDatabaseConnections();
  console.log(`${colors.blue}MySQL Process List:${colors.reset}`);
  console.log(`Total Connections: ${processes.length}\n`);

  if (processes.length > 0) {
    console.log('ID     | Command | Time | State');
    console.log('-------|---------|------|------------------');
    
    processes.slice(0, 10).forEach(proc => {
      const timeColor = proc.TIME > 60 ? colors.red : colors.reset;
      console.log(
        `${proc.ID.toString().padEnd(7)}| ${proc.COMMAND.padEnd(8)}| ${timeColor}${proc.TIME.toString().padEnd(5)}${colors.reset}| ${proc.STATE || 'idle'}`
      );
    });

    if (processes.length > 10) {
      console.log(`\n... and ${processes.length - 10} more connections`);
    }
  }

  // Warnings
  if (poolInfo && poolInfo.used > 5) {
    console.log(`\n${colors.yellow}⚠️  Warning: High connection usage detected!${colors.reset}`);
    console.log('This may indicate:');
    console.log('  - Services being instantiated multiple times');
    console.log('  - Direct pool.execute() calls not being released');
    console.log('  - Hot reload keeping old connections alive');
  }

  const sleepingConnections = processes.filter(p => p.COMMAND === 'Sleep' && p.TIME > 60);
  if (sleepingConnections.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Found ${sleepingConnections.length} sleeping connections older than 60 seconds${colors.reset}`);
  }
}

// Run monitoring
async function main() {
  if (process.argv.includes('--watch')) {
    // Continuous monitoring mode
    console.log('Starting continuous monitoring (Ctrl+C to stop)...\n');
    
    await monitorPool();
    
    setInterval(async () => {
      console.log('\n' + '='.repeat(50) + '\n');
      await monitorPool();
    }, 5000); // Update every 5 seconds
  } else {
    // Single run
    await monitorPool();
    
    console.log(`\n${colors.cyan}Tip: Run with --watch for continuous monitoring${colors.reset}`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Monitor failed:', error);
  process.exit(1);
});