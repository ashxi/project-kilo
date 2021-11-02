const {app, BrowserWindow, ipcMain, ipcRenderer, dialog, Menu, MenuItem} = require('electron');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true
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
    
    const menu = new Menu();

    menu.append(new MenuItem({
        label: 'Bedrock',
        submenu: [{
            label: 'Reload',
            accelerator: "Ctrl+R",
            click: () => {
                mainWindow.webContents.send('reload', 'reloadWindow')
            }
        }, {
            label: "Refresh Renderer",
            accelerator: "Ctrl+Shift+R",
            click: () => {
                mainWindow.webContents.send('refresh', 'reloadRenderer')
            }
        }, {
            label: 'Quit',
            accelerator: "Ctrl+Q",
            click: () => {
                app.quit();
            }
        }, {
            label: 'Toggle DevTools',
            accelerator: "Ctrl+Shift+I",
            click: () => {
                mainWindow.webContents.toggleDevTools();
            }
        }]
    }))

    Menu.setApplicationMenu(menu);

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

ipcMain.on('selectDirectory', async function() {
    const dir = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    
    if (!dir.canceled) {
        return(dir.filePaths)
    } else {
        return(null);
    }
});