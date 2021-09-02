const { app, BrowserWindow, ipcMain } = require("electron");

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
}

ipcMain.on("close-program", ()=>{
    //Close the program
    win.close();
})

app.whenReady().then(()=>{
    createWindow();
})