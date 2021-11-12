const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron'),
      fs = require('fs');

let mainWindow,
    windowInfo;

function createWindow () {
    async function autoUpdate() {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        while (true) {
            try {
                let builtString;
                
                if (mainWindow.isMaximized()) {
                    builtString = `{\n  "width": ${windowInfo.width},\n  "height": ${windowInfo.height},\n  "x": ${windowInfo.x},\n  "y": ${windowInfo.y},\n  "isMaximized": true,\n  "isDevMode": true\n}`;
                } else {
                    builtString = `{\n  "width": ${mainWindow.getSize()[0]},\n  "height": ${mainWindow.getSize()[1]},\n  "x": ${mainWindow.getPosition()[0]},\n  "y": ${mainWindow.getPosition()[1]},\n  "isMaximized": ${mainWindow.isMaximized()},\n  "isDevMode": true\n}`;
                }

                await fs.promises.writeFile('./config.json', builtString);
                windowInfo = JSON.parse(builtString);
            } catch (e) {
                console.warn(e);
            }

            await sleep(2500);
        }
    }

    try {
        let magic = fs.readFileSync("./config.json");
        windowInfo = JSON.parse(magic);
    } catch (err) {
        try {
            let loadedJSON = `{\n  "width": 800,\n  "height": 600,\n  "x": null,\n  "y": null,\n  "isMaximized": false,\n  "isDevMode": true\n}`;
            fs.writeFileSync("./config.json", loadedJSON);
            windowInfo = JSON.parse(loadedJSON);
        } catch (e) {
            console.error(`There were 2 errors loading the configuration! ${err}; ${e}`);   
        }
    }

    if (windowInfo.x == null || windowInfo.y == null) {
        mainWindow = new BrowserWindow({
            width: windowInfo.width,
            height: windowInfo.height,
            frame: false,
            backgroundColor: '#FFF',
            title: "Bedrock",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                preload: __dirname + "/src/preload.js"
            } 
        });
    } else {
        mainWindow = new BrowserWindow({
            width: windowInfo.width,
            height: windowInfo.height,
            x: windowInfo.x,
            y: windowInfo.y,
            frame: false,
            backgroundColor: '#FFF',
            title: "Bedrock",
            icon: __dirname + "/src/logo.png",
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                preload: __dirname + "/src/preload.js"
            } 
        });
    }

    if (windowInfo.isMaximized) {
        mainWindow.maximize();
    }

    require('@electron/remote/main').initialize();
    require("@electron/remote/main").enable(mainWindow.webContents)

    mainWindow.loadFile('./src/index.html');
    
    const menu = new Menu();
    let menuSub = [{
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
    }];

    if (windowInfo.isDevMode) {
        menuSub.push({
            label: 'Dev Tools',
            accelerator: "Ctrl+Shift+I",
            click: () => {
                mainWindow.webContents.openDevTools();
            }
        });
    }

    menu.append(new MenuItem({
        label: 'Bedrock',
        submenu: menuSub
    }));
    
    Menu.setApplicationMenu(menu);

    mainWindow.webContents.once('dom-ready', () => {autoUpdate()});
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
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