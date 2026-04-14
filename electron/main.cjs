const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const fs = require("node:fs");

const DEFAULT_PORT = 3000;
const LOCAL_URL = `http://127.0.0.1:${DEFAULT_PORT}`;

/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;

function loadEnvFromFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // 未作成でもよい
  }
}

function waitForPort(port, timeoutMs = 90_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tryOnce() {
      const socket = net.connect(port, "127.0.0.1", () => {
        socket.destroy();
        resolve(undefined);
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`ポート ${port} が開きませんでした`));
        } else {
          setTimeout(tryOnce, 250);
        }
      });
    }
    tryOnce();
  });
}

function getBundledNodePath() {
  const name = process.platform === "win32" ? "node.exe" : "node";
  return path.join(process.resourcesPath, "bundled-node", name);
}

function getStandaloneDir() {
  return path.join(process.resourcesPath, "next-standalone");
}

function startNextStandalone() {
  const standaloneDir = getStandaloneDir();
  const serverJs = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(`サーバーが見つかりません: ${serverJs}`);
  }

  const userEnv = path.join(app.getPath("userData"), "commuhub.env");
  loadEnvFromFile(userEnv);

  const nodeBin = getBundledNodePath();
  if (!fs.existsSync(nodeBin)) {
    throw new Error(`Node 実行ファイルが見つかりません: ${nodeBin}`);
  }

  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(DEFAULT_PORT),
    HOSTNAME: "127.0.0.1",
    COMMUHUB_ELECTRON: "1",
  };

  serverProcess = spawn(nodeBin, [serverJs], {
    cwd: standaloneDir,
    env,
    stdio: "inherit",
    windowsHide: false,
  });

  serverProcess.on("error", (err) => {
    console.error("Next サーバー起動エラー:", err);
  });
}

/**
 * 自己署名・期限切れ等でブラウザが拒否する TLS でも読み込めるようにする。
 * 運用で常に検証したい場合は `COMMUHUB_ELECTRON_STRICT_TLS=1`（または commuhub.env に同記述）。
 */
function registerTlsCertificateBypassIfNeeded() {
  if (process.env.COMMUHUB_ELECTRON_STRICT_TLS === "1") {
    return;
  }
  session.defaultSession.on(
    "certificate-error",
    (event, _webContents, _url, _error, _certificate, callback) => {
      event.preventDefault();
      callback(true);
    },
  );
}

function getWindowIconPath() {
  const ico = path.join(__dirname, "assets", "commuHubIcon.ico");
  if (fs.existsSync(ico)) return ico;
  const png = path.join(__dirname, "assets", "commuHubIcon.png");
  if (fs.existsSync(png)) return png;
  const svg = path.join(__dirname, "assets", "commuHubIcon.svg");
  if (fs.existsSync(svg)) return svg;
  return undefined;
}

function createWindow() {
  const icon = getWindowIconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    ...(icon ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(LOCAL_URL);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function ready() {
  const isDev = !app.isPackaged;

  if (isDev) {
    await waitForPort(DEFAULT_PORT);
    createWindow();
    return;
  }

  startNextStandalone();
  await waitForPort(DEFAULT_PORT);
  createWindow();
}

app.whenReady().then(() => {
  loadEnvFromFile(path.join(app.getPath("userData"), "commuhub.env"));
  registerTlsCertificateBypassIfNeeded();
  ready().catch((err) => {
    console.error(err);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    ready().catch(console.error);
  }
});
