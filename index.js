/*
  Window management & initialization code.

  Copyright (c) 2021 Concrete Team
  Licensed under the MIT License (MIT).
  Happy Coding! :^)
*/

const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron'),
      { performance } = require('perf_hooks'),
      fs = require('fs');
const { crash } = require('process');

let mainWindow,
    setupWindow,
    isSetupCheck,
    loaderMain,
    windowInfo;

let logArr = ["[init] Initializing logs..."];

// Function to save logs to array, and print to console.

// Function to restart the app, by using relaunch and exit.
async function restart() {
    console.log("Restarting...");
    app.relaunch();
    app.exit();
}

/**
 * Checks if the app is setup or not.
 * @returns {boolean} true if the app is setup, false if not.
 */
async function isSetup() {
    try {
        await fs.readFileSync("./isSetup.txt");
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * logs message to console and saves to log array, to possibly be saved to file later.
 * @param {string} type type of log message
 * @param {string} string log message 
 */

function log(type, string) {
    let time = new Date().toString().split(" ");
    let args = `(${time[4]}) [${type}] ${string}`;

    if (type == "") {
        args = args.replace(" []", "");
    }

    console.log(args);
    logArr.push(args);
}

/**
 * crashes app to be used under fatal conditions.
 * @param {string} arg error message
 */
async function error(arg) {
    log("init", "Recieved error signal, force quitting...");
    log("init", "Error: " + arg);
    // Close the main window.
    try {
        mainWindow.close();
    } catch (e) {
        log("init", "Error closing main window: " + e);
    }
    // Try to close loader.
    try {
        loaderMain.close();
    } catch (e) {
        log("init", "Loader window was not open, continuing...");
    }
    await fs.writeFileSync("./log.txt", logArr.join("\n"));
    // Show dialog error box.
    dialog.showErrorBox("Error", "An fatal error has occured. Please restart the app.");
    app.quit();
}
// Sleep function needed for while(true) loops.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

log("init", "Initializing createWindow()...");

// Creates windows, loading screen and main display.
async function createWindow () {
    // Auto updates the config, manually.
    async function autoUpdate() {
        while (true) {
            try {
                //log("init::autoUpdate::config", "Updating config...");
                // Built string for config.
                let builtString;
                
                // If is maximized, return same height with maximized paramater.
                if (mainWindow.isMaximized()) {
                    builtString = `{\n  "width": ${windowInfo.width},\n  "height": ${windowInfo.height},\n  "x": ${windowInfo.x},\n  "y": ${windowInfo.y},\n  "isMaximized": true,\n  "isDevMode": ${windowInfo.isDevMode},\n  "bypassConfig":${windowInfo.bypassConfig},\n  "bypassHangup": ${windowInfo.bypassHangup}\n}`;
                } else {
                    builtString = `{\n  "width": ${mainWindow.getSize()[0]},\n  "height": ${mainWindow.getSize()[1]},\n  "x": ${mainWindow.getPosition()[0]},\n  "y": ${mainWindow.getPosition()[1]},\n  "isMaximized": ${mainWindow.isMaximized()},\n  "isDevMode": ${windowInfo.isDevMode},\n  "bypassConfig":${windowInfo.bypassConfig},\n  "bypassHangup": ${windowInfo.bypassHangup}\n}`;
                }

                // Writes file to local config.json
                await fs.promises.writeFile('./config.json', builtString);
                // Updates 'windowInfo' to latest builtString
                windowInfo = JSON.parse(builtString);
                //log("init::autoUpdate::config", "Config updated.");
            } catch (e) {
                if (e.toString().startsWith("TypeError: Object has been destroyed")) {
                    crash("Error: Object has been destroyed");
                } else {
                    // Not *completely* fatal if it fails, although important. This could be caused by the local disk being full.
                    log("autoUpdate", "Failed to update config.json, error: " + e);
                    console.warn(e);
                }
            }

            await sleep(2500);
        }
    }

    try {
        // Reads config, and writes it at initialization.
        log("init", "Reading config.json...");
        let magic = fs.readFileSync("./config.json");
        windowInfo = JSON.parse(magic);
        log("init", "Config.json read.");
    } catch (err) {
        try {
            // Saves loaded configuration if it doesn't exist.
            log("init", "Config.json not found, creating...");
            let loadedJSON = `{\n  "width": 800,\n  "height": 600,\n  "x": null,\n  "y": null,\n  "isMaximized": true,\n  "isDevMode": false,\n  "bypassConfig":false,\n  "bypassHangup": false}`;
            fs.writeFileSync("./config.json", loadedJSON);
            windowInfo = JSON.parse(loadedJSON);
            log("init", "Config.json created.");
        } catch (e) {
            // Near fatal error, warns the user via console that there was 2 errors loading the config.
            log("init", "Failed to create config.json, error: " + e);
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

    log("init", "Creating main window...");

    isSetupCheck = await isSetup();

    let filePath = './src/index.html';

    if (!isSetupCheck) {
        log("init", "isSetup() returned false, loading installer...");
        config.webPreferences.preload = __dirname + "/installer/preload.js";
        config.width = 500;
        config.height = 150;
        config.x = null;
        config.y = null;
        config.center = true;
        config.autoHideMenuBar = true;

        filePath = "./installer/index.html";

        setupWindow = new BrowserWindow(config);
        setupWindow.loadFile(filePath);
        //setupWindow.toggleDevTools();
    } else {
        mainWindow = new BrowserWindow(config);
        mainWindow.loadFile(filePath);
    }

    const BypassHangup = windowInfo.bypassHangup;
      
    // If local debug mode is true, we don't hide the window and open dev tools instead.
    // Else, hide the window.

    if (!BypassHangup && !isSetupCheck) {
        try {
            mainWindow.hide();
        } catch (e) {
            log("init", "Failed to hide window, error: " + e);
        }
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


    log("init", "Loading loader window...");
      
    // Hides loader until DOM is loaded.

    loaderMain.hide();

    loaderMain.loadFile(__dirname + "/loader/loader.html");
      
    // Initialize remote for renderer
    require('@electron/remote/main').initialize();
    if (!isSetupCheck) {
        require("@electron/remote/main").enable(setupWindow.webContents);
    } else {
        require("@electron/remote/main").enable(mainWindow.webContents);
    }
      
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
        label: "Restart App",
        accelerator: "Ctrl+Shift+R",
        click: () => {
            restart()
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
    
    if (isSetupCheck) {
        Menu.setApplicationMenu(menu);
    }
      
    // Initalize auto update.

    if (isSetupCheck) mainWindow.webContents.once('dom-ready', () => {autoUpdate()});
      
    // Intialize the loader. 
    
    loaderMain.webContents.once('dom-ready', () => {
        log("init", "Loader window loaded.");
        loaderMain.show();
        loaderMain.focus();
    });
      
    // When loader is ready, show. And if needed, maximize.

    ipcMain.on('ready', async(event, arg) => {
        try {
            log("init", "Main process is preparing to be ready...");
            if (process.platform !== 'win32') {
                mainWindow.webContents.send('lenox', 'hid');
            }
            try {
                loaderMain.close();
            } catch (e) {
                log("init", "Failed to close loader window, error: " + e);
            }
            await sleep(750);
            mainWindow.show();
            if (windowInfo.isMaximized) {
                mainWindow.maximize();
            }
            mainWindow.focus();
            
            log("init", "Main process is ready.");
            log("init", `Total time taken to initialize: ${performance.now() / 1000}`);
        } catch (e) {
            error("Failed to show main process! Error: " + e);
        }
    })

    ipcMain.on('finished-setup', async(event, arg) => {
        restart();
    })
}

// Create window when electron is fully loaded.

app.on('ready', createWindow);

// If on macOS, quit the macOS way:tm:.
// Else, exit normally.

app.on('window-all-closed', async function() {
    log("init", "Exiting...");
    if (windowInfo.isDevMode) {
        await fs.writeFileSync("./log.txt", logArr.join("\n"));
    }
    app.quit();
});

// When recieved the restart event, call restart()

ipcMain.on('restart', async(event, arg) => {
    restart();
})

// When recieved error signal, force quit.

ipcMain.on('error', async(event, arg) => {
    error(arg);
})

ipcMain.on('logging', async(event, arg) => {
    log("", arg);
})
