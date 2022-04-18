const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, Notification, systemPreferences} = require("electron");
const find = require("find-process");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');
const autoLaunch = require("auto-launch");
const fs = require("fs-extra");
const path = require("path");
const env = require("dotenv");
env.config();

var backEndMessageBuffer = [] //This stores any errors that occur before the creation of the window object. It will be sent over to the renderer process when it has been opened.

var config;
var systemConfig;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

var tray = null;

const filesPath = app.getPath("userData");
app.setAppUserModelId('MineTrack');

var win;
var devToolsWin;

function showNotification(title, body) {
    new Notification({title: title, body:body}).show();
}

let myWindow = null

const instanceLock = app.requestSingleInstanceLock();

//Quits the program if the lock for a single instance is initiated
if (!instanceLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window. Haven't figured out why this isn't working yet
      if (myWindow) {
        if (myWindow.isMinimized()) myWindow.restore()
        myWindow.focus()
      }
    })
      
    // Create win, load the rest of the app, etc...
    app.on('ready', () => {
    })
  }

//Set up the autoupdater
var obj = {
    autoUpdate: true,
    installOnRestart: true,
    autoInstall: false
}
log.info("App starting..")
autoUpdater.autoDownload = obj.autoUpdate;
autoUpdater.autoInstallOnAppQuit = obj.installOnRestart;

autoUpdater.on("error", (ev)=>{
    console.log("error", ev);
})

autoUpdater.on("update-available", (ev)=>{
    win.webContents.send("update-ready", "");
})


var progLauncher = new autoLaunch({
    name: "MineTrack"
})



var ctxMenu = Menu.buildFromTemplate([
    {
        label: "MineTrack",
        enabled: false
    },
    {label: 'Show app', click: ()=>{
        win.show();
    }},
    {label: "Quit", click: ()=>{
        app.forceClose = true;
        app.quit();
    }}
])

async function createWindow() {
    //Load the system config
    try {
        var show = !config.startInTray || true;
    } catch (error) {
        var show = true;
    }
    console.log(show);

    try {
        win = new BrowserWindow({
            frame: false,
            transparent: true,
            height: 600,
            width: 700,
            maxHeight: 600,
            maxWidth: 700,
            minHeight: 600,
            minWidth: 700,
            show: show,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                backgroundThrottling: false
            }
        })
    
        win.loadFile('index.html');
        
        win.webContents.on("did-finish-load", (ev)=>{

            progLauncher.isEnabled()
            .then((res)=>{
                if(!res) {
                    win.webContents.send("request-autostart", "");
                }
            })


            autoUpdater.checkForUpdatesAndNotify();
            win.webContents.send("files-path", filesPath);
            win.webContents.send("app-version", app.getVersion())
        })
    
        win.on('blur', ()=>{
            win.webContents.send("allow-checking-for-minecraft","")
        })  
    
        win.on('focus', ()=>{
            win.webContents.send("deny-checking-for-minecraft","")
        })   
        
        
        win.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
          });
        
        win.on("close", (ev)=>{
            win.webContents.send("backend-messages", "Closing");
            try {
                if(!app.forceClose && systemConfig.enableTray) {
                    ev.preventDefault();

                    //Check if this is the first time closing the program. If that's the case, notify the user of what is going to happen
                    if(config.closedBefore == false) {
                        showNotification("The program is still running", "MineTrack is still running in the system tray. This can be disabled in the settings menu.");
                        config.closedBefore = true;
                        saveConfig();
                    }


                    if(tray){return win.hide()}
                    win.webContents.send("backend-messages", "Creating tray");
                    tray = new Tray(path.join(__dirname, "icon.png"));
                    tray.setContextMenu(ctxMenu);
                    tray.setToolTip("MineTrack");
                    win.hide();
                } else if(!systemConfig.enableTray) {
                    //Close the program immedeately

                }
            } catch (error) {
                win.webContents.send("backend-messages", error.toString());
                
            }
            

            return;
        })


        //Do this if developer
        if(process.env.NODE_ENV == "developer") {
            devToolsWin = new BrowserWindow();
            win.webContents.setDevToolsWebContents(devToolsWin.webContents);
            win.webContents.openDevTools({ mode: 'detach' })
        }

    } catch (error) {
        console.log(error);
    }

}


function saveConfig() {
    return new Promise((resolve, reject)=>{
        try {
            fs.writeFile(path.join(filesPath, "systemconfig.json"), JSON.stringify(config, null, 4));
            resolve();
        } catch (error) {
            reject(error);
        }
    })
}

//Check if the system configuration files exist
function checkConfigs() {
    return new Promise(async (resolve, reject)=>{
        try {
            config = await fs.readFile(path.join(filesPath, "systemconfig.json"));
            config = JSON.parse(config);
            //This config file is accessable throughout the boot.js file, because its declaration is hoisted to the top of the document (line 10)
            resolve();
        } catch (error) {
            config = {
                closedBefore: false, //This is used to determine if the program should display the first time closing notification
                startInTray: false, //This one will be editable in the program settings
                enableTray: true
            }
            try {
                console.log(config)
                await fs.writeFile(path.join(filesPath, "systemconfig.json"), JSON.stringify(config, null, 4/*Pretty print*/));   
                resolve();
            } catch (error) {
                backEndMessageBuffer.push({
                    messageType: "error",
                    errorString: error.toString()
                })
                reject(error);
            }
        }
    })    
}


async function updateConfigs() {
    return new Promise(async (resolve, reject)=>{
        try {
            systemConfig = JSON.parse(await fs.readFile(path.join(filesPath, "systemconfig.json"),"utf8"));
        } catch (error) {
            reject(error);
        }

        try {
            config = JSON.parse(await fs.readFile(path.join(filesPath, "configs", "userdata.json"), "utf8"));
            console.log(config);
        } catch (error) {
            reject(error);
        }
        resolve();
    })
}

ipcMain.handle("enable-autostart", (event, arg)=>{
    progLauncher.enable();
    progLauncher.isEnabled()
    .then((res)=>{
        return res;
    })
})

ipcMain.on("close-program", ()=>{
    //Close the program
    console.log("CLOSING")
    win.close();
})

ipcMain.on("minimize-program", ()=>{
    //Close the program
    win.minimize();
})

ipcMain.on("relaunch-program", ()=>{
    //Close the program
    app.relaunch();
    app.exit();
})

ipcMain.handle("open-directory-modal", async (event, arg)=>{
    var result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    })
    return result.filePaths;
})

ipcMain.handle("open-image-selector", async(event, arg) => {
    var res = await dialog.showOpenDialog(win, {
        properties: ["openFile"],
        filters: [{name: "Images", extensions: ["png", "jpg", "bmp", "gif"]}]
    })

    return res.filePaths;
})

app.whenReady().then(()=>{
    
    checkConfigs()
    .then(()=>{
        createWindow();
    })
    .catch((err)=>{
        console.log(err);
        //If an error occurs while checking for the system configuration files, continue the startup process anyway.
        createWindow();
    })
    //createWindow();
})

ipcMain.handle("check-for-minecraft", async(event, arg) =>{
    var list = await checkForMinecraft();
    return list;
})


function checkForMinecraft() {
    return new Promise((resolve, reject)=>{
        find("name", "javaw", false)
        .then((list)=>{
            if(list) {
                resolve(list)
            } else {
                resolve(false);
            }
        })
        .catch((err)=>{
            reject(err);
        })
    })
}

ipcMain.handle("update-configs", (ev, data)=>{
    updateConfigs()
    .then((res)=>{
        return true;
    })
    .catch((err)=>{
        return err;
    })
})


