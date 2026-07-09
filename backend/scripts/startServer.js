const { spawn } = require("child_process");
const net = require("net");

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function start() {
  const inUse = await isPortInUse(5000);
  if (inUse) {
    console.log("Port 5000 is already in use. Stop the old server first, then run: npm start");
    process.exit(1);
  }

  const child = spawn("node", ["server.js"], { stdio: "inherit", shell: true });
  child.on("exit", (code) => process.exit(code || 0));
}

start();
