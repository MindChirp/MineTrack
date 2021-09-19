const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu} = require("electron");
const find = require("find-process");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');
const autoLaunch = require("auto-launch");
const fs = require("fs-extra");
const path = require("path");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

var tray = null;

const filesPath = app.getPath("userData");
var win;
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
        var config = await fs.readFile(path.join(filesPath, "configs", "systemconfig.json"));
    } catch (error) {
        //no systemconfig
        var config = {
            show: true
        }
    }

    var show = config.show || true;
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
        
        /*
        win.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
          });
        */
        win.on("close", (ev)=>{
            win.webContents.send("backend-messages", "Closing");
            try {
                if(!app.forceClose) {
                    ev.preventDefault();
                    if(tray){return win.hide()}
                    win.webContents.send("backend-messages", "Creating tray");
                    tray = new Tray(path.join(__dirname, "icon.png"));
                    tray.setContextMenu(ctxMenu);
                    tray.setToolTip("MineTrack");
                    win.hide();
                }
            } catch (error) {
                win.webContents.send("backend-messages", error.toString());
                
            }
            

            return;
        })
        
    } catch (error) {
        console.log(error, "ERROR APPENDIX");
    }

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

app.whenReady().then(()=>{
    console.log("asdasda")
    createWindow();
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

