import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const skipBuild = process.env.VERIFY_NO_BUILD === '1';

const steps = [
  {
    label: 'API lint',
    command: 'npm',
    args: ['run', 'lint', '-w', '@app/api'],
  },
  {
    label: 'API unit tests',
    command: 'npm',
    args: ['run', 'test:unit', '-w', '@app/api'],
  },
  {
    label: 'Web lint',
    command: 'npm',
    args: ['run', 'lint', '-w', '@app/web'],
  },
  {
    label: 'Web unit tests',
    command: 'npm',
    args: ['run', 'test', '-w', '@app/web'],
  },
  ...(skipBuild
    ? []
    : [
        {
          label: 'API build',
          command: 'npm',
          args: ['run', 'build', '-w', '@app/api'],
        },
        {
          label: 'Web build',
          command: 'npm',
          args: ['run', 'build', '-w', '@app/web'],
        },
      ]),
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`\n[verify] ${step.label}`);
    const child = spawn(step.command, step.args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${step.label} failed with exit code ${code}`));
    });
  });
}

async function main() {
  for (const step of steps) {
    await runStep(step);
  }
  console.log('\n[verify] OK');
}

main().catch((error) => {
  console.error(`\n[verify] FAILED: ${error.message}`);
  process.exit(1);
});
