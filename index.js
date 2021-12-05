/*
  Window management & initialization code.

  Copyright (c) 2021 Concrete Team
  Licensed under the MIT License (MIT).
  Happy Coding! :^)
*/

const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron'),
      fs = require('fs');

// Sleep function needed for while(true) loops.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const BypassHangup = false; 
// Set to false when commiting, this just forces it (when true) to force mainwindow to not hide & autostarts devtools which REALLY helps for debugging.

let mainWindow,
    loaderMain,
    windowInfo;

// Creates windows, loading screen and main display.
function createWindow () {
    // Auto updates the config, manually.
    async function autoUpdate() {
        while (true) {
            try {
                // Built string for config.
                let builtString;
                
                // If is maximized, return same height with maximized paramater.
                if (mainWindow.isMaximized()) {
                    builtString = `{\n  "width": ${windowInfo.width},\n  "height": ${windowInfo.height},\n  "x": ${windowInfo.x},\n  "y": ${windowInfo.y},\n  "isMaximized": true,\n  "isDevMode": ${windowInfo.isDevMode},\n  "bypassConfig":${windowInfo.bypassConfig}\n}`;
                } else {
                    builtString = `{\n  "width": ${mainWindow.getSize()[0]},\n  "height": ${mainWindow.getSize()[1]},\n  "x": ${mainWindow.getPosition()[0]},\n  "y": ${mainWindow.getPosition()[1]},\n  "isMaximized": ${mainWindow.isMaximized()},\n  "isDevMode": ${windowInfo.isDevMode},\n  "bypassConfig":${windowInfo.bypassConfig}\n}`;
                }

                // Writes file to local config.json
                await fs.promises.writeFile('./config.json', builtString);
                // Updates 'windowInfo' to latest builtString
                windowInfo = JSON.parse(builtString);
            } catch (e) {
                // Not *completely* fatal if it fails, although important. This could be caused by the local disk being full.
                console.warn(e);
            }

            await sleep(2500);
        }
    }

    try {
        // Reads config, and writes it at initialization.
        let magic = fs.readFileSync("./config.json");
        windowInfo = JSON.parse(magic);
    } catch (err) {
        try {
            // Saves loaded configuration if it doesn't exist.
            let loadedJSON = `{\n  "width": 800,\n  "height": 600,\n  "x": null,\n  "y": null,\n  "isMaximized": true,\n  "isDevMode": false,\n  "bypassConfig":false\n}`;
            fs.writeFileSync("./config.json", loadedJSON);
            windowInfo = JSON.parse(loadedJSON);
        } catch (e) {
            // Near fatal error, warns the user via console that there was 2 errors loading the config.
            console.error(`There were 2 errors loading the configuration! ${err}; ${e}`);   
        }
    }
      
    // Default config for the main window.

    let config = {
        width: windowInfo.width,
        height: windowInfo.height,
        x: windowInfo.x,
        y: windowInfo.y,
        frame: false,
        backgroundColor: '#FFF',
        title: "Concrete",
        icon: __dirname + "/src/logo.png",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            enableRemoteModule: true,
            preload: __dirname + "/src/preload.js"
        } 
    }
    
    // If it's null, we center it because it doesn't exist.

    if (windowInfo.x == null || windowInfo.y == null) {
        config.center = true;
        config.x = null;
        config.y = null;
    }
      
    // If not on windows, do not show custom frame.

    if (process.platform !== 'win32') {
        config.frame = true;
    }

    mainWindow = new BrowserWindow(config);
      
    // If local debug mode is true, we don't hide the window and open dev tools instead.
    // Else, hide the window.

    if (!BypassHangup) {
        mainWindow.hide();
    } else {
        mainWindow.openDevTools();
    }
      
    // Initiaizes the loader window.

    loaderMain = new BrowserWindow({
        width: 253,
        height: 452,
        frame: false,
        backgroundColor: '#FFF',
        title: "Concrete is Loading...",
        icon: __dirname + "/src/logo.png",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            enableRemoteModule: true,
        } 
    });
      
    // Hides loader until DOM is loaded.

    loaderMain.hide();

    loaderMain.loadFile(__dirname + "/loader/loader.html");
      
    // Initialize remote for renderer
    require('@electron/remote/main').initialize();
    require("@electron/remote/main").enable(mainWindow.webContents)
      
    // Loads main window's file.

    mainWindow.loadFile('./src/index.html');
      
    // Menu bar seen on some Linux DE's/WM's and macOS.
    // The main purpose is to set up keybindings.
    
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
    }
];
      
    // If dev mode is true, add dev tools.
    
    if (windowInfo.isDevMode) {
        menuSub.push({
            label: 'Dev Tools',
            accelerator: "Ctrl+Shift+I",
            click: () => {
                mainWindow.webContents.openDevTools();
            }
        });
    }
      
    // Initiaizes menu, and sets it up.

    menu.append(new MenuItem({
        label: 'Concrete',
        submenu: menuSub
    }));
    
    Menu.setApplicationMenu(menu);
      
    // Initalize auto update.

    mainWindow.webContents.once('dom-ready', () => {autoUpdate()});
      
    // Intialize the loader. 
    
    loaderMain.webContents.once('dom-ready', () => {
        loaderMain.show();
        loaderMain.focus();
    });
      
    // When loader is ready, show. And if needed, maximize.

    ipcMain.on('ready', async(event, arg) => {
        try {
            if (process.platform !== 'win32') {
                mainWindow.webContents.send('lenox', 'hid');
            }
            loaderMain.close();
            await sleep(750);
            mainWindow.show();
            if (windowInfo.isMaximized) {
                mainWindow.maximize();
            }
            mainWindow.focus();
        } catch (e) {}
    })
}

// Create window when electron is fully loaded.

app.on('ready', createWindow);

// If on macOS, quit the macOS way:tm:.
// Else, exit normally.

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Function to restart the app, by using relaunch and exit.

async function restart() {
    console.log("Restarting...");
    app.relaunch();
    app.exit();
}

// When recieved the restart event, call restart()

ipcMain.on('restart', async(event, arg) => {
    restart();
})
