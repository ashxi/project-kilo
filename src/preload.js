const fs = require("fs"), 
    { contextBridge, ipcRenderer } = require("electron"),
    brew = require("./brewAPI.js").brew;

let isBrewError = false;

localStorage.setItem('brewCache_hrefURL', null);

try {
    contextBridge.exposeInMainWorld("brew", brew);
} catch (e) {
    isBrewError = true;
    console.warn(`Failed to expose Brew API! This may result in some features not working!\n${e}`);
}

loadThemes = brew.misc.loadThemes;

document.addEventListener("DOMContentLoaded", async function() {
    let themes;

    async function loadKeybindings() {
        const {ipcRenderer} = require('electron')

        ipcRenderer.on('reload', (event, arg) => {
            if (localStorage.getItem("initialSetup") == "true") {
                brew.location.reload();
            }
         })

         ipcRenderer.on('refresh', (event, arg) => {
            window.location.reload();
         })

         ipcRenderer.on('lenox', (event, arg) => {
            document.querySelector(':root').style.setProperty('--titlebar-height', '0px');
            document.querySelector(':root').style.setProperty('--rounded-corners', '0px');
            document.querySelector(':root').style.setProperty('--linux-height', '0px');
         })
    }
    
    async function loadInit() {
        const data = fs.readFileSync(__dirname + "/base.html", {encoding:'utf8', flag:'r'});

        let htmlData = "";

        // 0 = themes, 1=fonts, 2=windowicons
        let defaults = ["", "", ""];
        let paths = ["", "", ""]; 
            
        if (localStorage.getItem("initialSetup") != "true") {
            localStorage.setItem("theme", "default");
            localStorage.setItem("font", "fira-code");
            localStorage.setItem("windowicons", "vscode-fluent-icons");

            htmlData = fs.readFileSync(__dirname + "/setup.html", {encoding:'utf8', flag:'r'});
        } else {
            htmlData = document.body.innerHTML;
        }

        for (themeJSON of themes) {
              if (themeJSON.type == "theme") {
                  if (themeJSON.shortname == localStorage.getItem("theme")) {
                      paths[0] = themeJSON.path;
                  }

                  if (themeJSON.shortname == "default") {
                      defaults[0] = themeJSON.path;
                  }
              } else if (themeJSON.type == "font") {
                const path = require("path");

                if (themeJSON.shortname == localStorage.getItem("font")) {
                    paths[1] = path.relative(__dirname, themeJSON.regular);
                }

                if (themeJSON.shortname == "fira-code") {
                    defaults[1] = [path.relative(__dirname, themeJSON.regular), themeJSON.installedname];
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

        if (paths[0] == "") {
            paths[0] = defaults[0];
        } else if (paths[1] == "") {
            paths[1] = defaults[1];
        } else if (paths[2] == "") {
            paths[2] = defaults[2];
        }

        let theme = await fs.readFileSync(paths[0], {encoding:'utf8', flag:'r'});

        let patchAll = paths[1].replaceAll("\\", "/").replaceAll(" ", "\ ");
        let font = new FontFace(`codeDefault`, `url("${patchAll}")`);

        font.load(font).then(function(loadedFont) {
            document.fonts.add(loadedFont);
        });

        let windowicons = paths[2];

        document.body.innerHTML = `${data}<style>${theme}</style><div id="mainWindow" class="main"></div>`;

        document.body.style.backgroundColor = "#2a3c3c";
        brew.location.replaceHTML(htmlData);
    }

    async function loadTitle() {
        while (true) {
            document.getElementById("editorTitle").innerHTML = document.title;
            await brew.misc.sleep(50);
        }
    }

    themes = await loadThemes();

    await loadInit();
    
    try {
        await require("./renderer.js");
        loadTitle();
    } catch (e) {} // Linux fun.

    ipcRenderer.send('ready');

    if (isBrewError) {
        alert("We failed to expose the Brew API! This will cause the app to break.")
    }

    await loadKeybindings();
}) 