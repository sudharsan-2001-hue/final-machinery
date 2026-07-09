const { execSync, spawn } = require("child_process");
const path = require("path");

function killPort5000() {
  try {
    const output = execSync('netstat -ano | findstr ":5000" | findstr "LISTENING"', {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    output.split("\n").forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    });
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port 5000`);
      } catch (_) {}
    });
  } catch (_) {}
}

killPort5000();

setTimeout(() => {
  const server = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: true,
  });
  server.on("exit", (code) => process.exit(code || 0));
}, 1500);
