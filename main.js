const { app, BrowserWindow, Menu, ipcMain } = require("electron");
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
var bodyParser = require("body-parser");
let express = require("express");
let http = express();
http.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
http.use(bodyParser.json({ limit: "100mb" })); //设置post body数据的大小
http.listen(6666);

let arr = [
  {
    label: "开发者工具",
    submenu: [
      {
        label: "打开/关闭",
        accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
        click: (item, focusedWindow) => {
          focusedWindow.toggleDevTools();
        },
      },
      {
        label: "刷新一下",
        role: "reload",
        accelerator: process.platform == "darwin" ? "Command+F5" : "Ctrl+F5",
      },
    ],
  },
];
let mainMenu = Menu.buildFromTemplate(arr);
Menu.setApplicationMenu(mainMenu);
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
    fullscreen: true,
    // simpleFullscreen: true,
  });

  // win.webContents.openDevTools();
  win.loadFile("index.html");

  // 点击主窗口的关闭按钮
  win.on("closed", () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.on("openvideo", (ev, val) => {
  let video = new BrowserWindow({
    // width: 800,
    // height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
    simpleFullscreen: true,
    alwaysOnTop: true,
    resizable: false,
    transparent: true,
  });
  // video.webContents.openDevTools()
  video.loadFile("video.html");
  video.webContents.on("did-finish-load", function () {
    console.log("发送消息");
    video.webContents.send("data", val);
    // setTimeout((video.webContents.send("data", val), 1000));
  });
});

http.get("/test", test);

function test(req, res) {
  console.log(req);
  res.render("videos.html");
}
