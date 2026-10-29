'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const services = [
  { name: 'API', directory: 'backend', script: 'start:dev' },
  { name: 'Web', directory: 'web', script: 'dev' },
];
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;

  for (const { child } of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
  }
}

console.log('بدء تشغيل واجهة الويب وواجهة API...');

for (const service of services) {
  const child = spawn(npmCommand, ['run', service.script], {
    cwd: path.join(__dirname, service.directory),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  children.push({ child });

  child.on('error', (error) => {
    console.error(`[${service.name}] تعذّر تشغيل npm: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;

    const exitCode = code ?? 1;
    console.error(
      `[${service.name}] توقفت الخدمة${signal ? ` بعد ${signal}` : ''} (code ${exitCode}).`,
    );
    stop(exitCode);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
