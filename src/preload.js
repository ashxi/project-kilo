/*
  Main code to *really* initialize the windows

  Copyright (c) 2021 Concrete Team
  Licensed under the MIT License (MIT).
  Happy Coding! :^)
*/

// Require required modules.
const fs = require("fs"), 
    { contextBridge, ipcRenderer } = require("electron"),
    path = require("path"),
    brew = require("./brewAPI.js").brew;

ipcRenderer.send("logging", "[preload.js] Initializing...");

// Resets the brew cache.
localStorage.setItem('brewCache_hrefURL', null);

ipcRenderer.send("logging", "[preload.js] Wiping brew cache...");

try {
    ipcRenderer.send("logging", "[preload.js] Initializing brew library...");
    // Exposes brew in the main world.
    contextBridge.exposeInMainWorld("brew", brew);
} catch (e) {
    // On error, crash app.
    brew.misc.crash("[preload.js] Failed to initialize brew library.");
}

// Redirects the load themes function. 
loadThemes = brew.misc.loadThemes;

document.addEventListener("DOMContentLoaded", async function() {
    ipcRenderer.send("logging", "[preload.js] Initializing window patching...");
    // Variable to store raw theme data.
    let themes;

    // This functions loads the keybindings, using ipcRender to communicate with the main process.
    async function loadKeybindings() {
        const {ipcRenderer} = require('electron')
        ipcRenderer.send("logging", "[preload.js] Loading keybindings...");

        ipcRenderer.on('reload', (event, arg) => {
            // If initial setup is complete, reload the app.
            if (localStorage.getItem("initialSetup") == "true") {
                brew.location.reload();
            }
         })

         ipcRenderer.on('refresh', (event, arg) => {
            // Forces the full window to reload.
            window.location.reload();
         })
    }
    
    async function loadInit() {
        ipcRenderer.send("logging", "[preload.js] Loading init...");
        // Reads the base file, for initialization.
        const data = fs.readFileSync(__dirname + "/base.html", {encoding:'utf8', flag:'r'});

        // Parsed data from the themes, fonts, etc.
        // 0 = themes, 1=fonts, 2=windowicons
        let defaults = ["", "", ""];
        let paths = ["", "", ""]; 
            
        // If the setup is not started or complete, set the themes to default.
        if (localStorage.getItem("initialSetup") != "true") {
            ipcRenderer.send("logging", "[preload.js] Initial setup not complete, setting default config...");
            localStorage.setItem("theme", "default");
            localStorage.setItem("font", "fira-code");
            localStorage.setItem("windowicons", "vscode-fluent-icons");
        }

        // For every theme in the themes array, parse it.
        for (themeJSON of themes) {
            // If the type is a theme, set the defaults to the default.
            // Else, if accurate, sets the localStorage's theme to the path.
            // Repeat for all of code snippets.
              if (themeJSON.type == "theme") {
                  ipcRenderer.send("logging", `[preload.js] Setting theme ${themeJSON.shortname}...`);
                  if (themeJSON.shortname == localStorage.getItem("theme")) {
                      paths[0] = themeJSON.path;
                  }

                  if (themeJSON.shortname == "default") {
                      defaults[0] = themeJSON.path;
                  }
              } else if (themeJSON.type == "font") {
                ipcRenderer.send("logging", `[preload.js] Setting font ${themeJSON.shortname}...`);
                if (themeJSON.shortname == localStorage.getItem("font")) {
                    paths[1] = path.relative(__dirname, themeJSON.regular);
                }

                if (themeJSON.shortname == "fira-code") {
                    defaults[1] = path.relative(__dirname, themeJSON.regular);
                }
            } else if (themeJSON.type == "windowicons") {
                ipcRenderer.send("logging", `[preload.js] Setting icons class 0 ${themeJSON.shortname}...`);
                if (themeJSON.shortname == localStorage.getItem("windowicons")) {
                    paths[2] = themeJSON.path;
                }

                if (themeJSON.shortname == "vscode-fluent-icons") {
                    defaults[2] = themeJSON.path;
                }
            }
        }

        // If undefined, sets the default to the path for each.
        if (paths[0] == "") {
            ipcRenderer.send("logging", `[preload.js] Loading defaults for themes...`);
            paths[0] = defaults[0];
        } else if (paths[1] == "") {
            ipcRenderer.send("logging", `[preload.js] Loading defaults for fonts...`);
            paths[1] = defaults[1];
        } else if (paths[2] == "") {
            ipcRenderer.send("logging", `[preload.js] Loading defaults for icons class 0...`);
            paths[2] = defaults[2];
        }

        // Reads the theme data in an async way.

        ipcRenderer.send("logging", `[preload.js] Reading theme...`);
        let theme = await fs.readFileSync(paths[0], {encoding:'utf8', flag:'r'});

        ipcRenderer.send("logging", `[preload.js] Reading font...`);
        // Some weird CSS rules. I don't make the rules.
        let patchAll = paths[1].replaceAll("\\", "/").replaceAll(" ", "\ ");
        // Creates a font face for the monospace font.
        let font = new FontFace(`codeDefault`, `url("${patchAll}")`);

        // Loads the font, then adds it.
        font.load(font).then(function(loadedFont) {
            document.fonts.add(loadedFont);
        });

        // Icons for the code.
        let windowicons = paths[2];

        // Sets the innerHTML to be updated.
        ipcRenderer.send("logging", `[preload.js] Pre-Patching DOM...`);
        document.body.innerHTML = `${data}<style>${theme}</style><div id="mainWindow" class="main"></div>`;

        // Sets the background color to the default theme's background color.
        document.body.style.backgroundColor = "#2a3c3c";
        // Uses brew to set the window's location.
        ipcRenderer.send("logging", `[preload.js] Handing over control to brew...`);
        await brew.location.replace(brew.location.href());
        ipcRenderer.send("logging", `[preload.js] Brew has returned.`);
    }

    // Loads the document title into the brew title every 50ms.
    async function loadTitle() {
        while (true) {
            document.getElementById("editorTitle").innerHTML = document.title;
            await brew.misc.sleep(50);
        }
    }

    // Sets the themes variable by calling load themes.
    themes = await loadThemes();

    // Calls the initialization process.
    await loadInit();

    // Loads the title into the DOM and calls the renderer.
    await require("./renderer.js");
    loadTitle();

    // Sends ready signal to the main process.

    ipcRenderer.send('ready');

    // Load the keybindings in an async way.

    await loadKeybindings();
    ipcRenderer.send("logging", "[preload.js] Keybindings loaded.");

    // Loads the project daemon.
    require("./projectDaemon.js");
    ipcRenderer.send("logging", "[preload.js] Project daemon loading...");
}) 