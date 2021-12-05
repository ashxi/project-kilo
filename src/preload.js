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

// Variable to warn the user if there is a Brew API initialization error.
let isBrewError = false;

// Resets the brew cache.
localStorage.setItem('brewCache_hrefURL', null);

try {
    // Exposes brew in the main world.
    contextBridge.exposeInMainWorld("brew", brew);
} catch (e) {
    // On error, sets the brew error flag, and warns the console.
    isBrewError = true;
    console.warn(`Failed to expose Brew API! This may result in some features not working!\n${e}`);
}

// Redirects the load themes function. 
loadThemes = brew.misc.loadThemes;

document.addEventListener("DOMContentLoaded", async function() {
    // Variable to store raw theme data.
    let themes;

    // This functions loads the keybindings, using ipcRender to communicate with the main process.
    async function loadKeybindings() {
        const {ipcRenderer} = require('electron')

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
        // Reads the base file, for initialization.
        const data = fs.readFileSync(__dirname + "/base.html", {encoding:'utf8', flag:'r'});

        // Parsed data from the themes, fonts, etc.
        // 0 = themes, 1=fonts, 2=windowicons
        let defaults = ["", "", ""];
        let paths = ["", "", ""]; 
            
        // If the setup is not started or complete, set the themes to default.
        if (localStorage.getItem("initialSetup") != "true") {
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
                  if (themeJSON.shortname == localStorage.getItem("theme")) {
                      paths[0] = themeJSON.path;
                  }

                  if (themeJSON.shortname == "default") {
                      defaults[0] = themeJSON.path;
                  }
              } else if (themeJSON.type == "font") {
                if (themeJSON.shortname == localStorage.getItem("font")) {
                    paths[1] = path.relative(__dirname, themeJSON.regular);
                }

                if (themeJSON.shortname == "fira-code") {
                    defaults[1] = path.relative(__dirname, themeJSON.regular);
                }
            } else if (themeJSON.type == "windowicons") {
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
            paths[0] = defaults[0];
        } else if (paths[1] == "") {
            paths[1] = defaults[1];
        } else if (paths[2] == "") {
            paths[2] = defaults[2];
        }

        // Reads the theme data in an async way.

        let theme = await fs.readFileSync(paths[0], {encoding:'utf8', flag:'r'});

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
        document.body.innerHTML = `${data}<style>${theme}</style><div id="mainWindow" class="main"></div>`;

        // Sets the background color to the default theme's background color.
        document.body.style.backgroundColor = "#2a3c3c";
        // Uses brew to set the window's location.
        brew.location.replace(brew.location.href());
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

    // If not on Windows, remove custom titlebar.
    // Else, loads the title into the DOM and calls the renderer.
    if (process.platform !== "win32") {
        document.querySelector(':root').style.setProperty('--titlebar-height', '0px');
        document.querySelector(':root').style.setProperty('--rounded-corners', '0px');
        document.querySelector(':root').style.setProperty('--linux-height', '0px');
    } else {
        await require("./renderer.js");
        loadTitle();
    }

    // Sends ready signal to the main process.

    ipcRenderer.send('ready');

    // If there is a brew error, warn the user and tell them that the app will break.
    if (isBrewError) {
        alert("We failed to expose the Brew API! This will cause the app to break.")
    }

    // Load the keybindings in an async way.

    await loadKeybindings();
}) 