const {app, BrowserWindow} = require('electron');
let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        backgroundColor: '#FFF',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            preload: __dirname + "/src/preload.js"
        } 
    });

    require('@electron/remote/main').initialize();
    require("@electron/remote/main").enable(mainWindow.webContents)

    mainWindow.loadFile('./src/index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});