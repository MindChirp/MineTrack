const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const find = require("find-process");
//const updater = require("electron-updater");
/*const debug = require('electron-debug');

debug();*/
const filesPath = app.getPath("userData");
var win;

//Set up the autoupdater
var obj = {
    autoUpdate: true,
    installOnRestart: true,
    autoInstall: false
}

//updater.autoDownload = obj.autoUpdate;
//updater.autoInstallOnAppQuit = obj.installOnRestart;


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
        })
    
        win.on('blur', ()=>{
            win.webContents.send("allow-checking-for-minecraft","")
        })  
    
        win.on('focus', ()=>{
            win.webContents.send("deny-checking-for-minecraft","")
        })   
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