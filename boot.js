const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const find = require("find-process");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');
  
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

/*debug();*/
const filesPath = app.getPath("userData");
var win;

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


function createWindow() {
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
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        })
    
        win.loadFile('index.html');
        
        win.webContents.on("did-finish-load", (ev)=>{
            
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
        
    } catch (error) {
        console.log(error, "ERROR APPENDIX");
    }

}

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

