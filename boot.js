const { app, BrowserWindow, ipcMain, dialog } = require("electron");

const filesPath = app.getPath("userData");
var win;
function createWindow() {
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
        win.webContents.send("allow-checking-for-minecraft")
    })  

    win.on('focus', ()=>{
        win.webContents.send("deny-checking-for-minecraft")
    })
}

ipcMain.on("close-program", ()=>{
    //Close the program
    win.close();
})

ipcMain.handle("open-directory-modal", async (event, arg)=>{
    var result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    })
    return result.filePaths;
})

app.whenReady().then(()=>{
    createWindow();
})