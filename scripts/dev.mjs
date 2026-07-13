import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const next = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--turbo",
    ...process.argv.slice(2),
  ],
  { stdio: ["inherit", "pipe", "pipe"] },
);

function write(line, stream) {
  stream.write(
    `${line.replace(/( - (?:Local|Network):\s+https?:\/\/\S+)/, "$1/dev")}\n`,
  );
}

createInterface({ input: next.stdout }).on("line", (line) => {
  write(line, process.stdout);
});

createInterface({ input: next.stderr }).on("line", (line) => {
  write(line, process.stderr);
});

next.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 1);
});
