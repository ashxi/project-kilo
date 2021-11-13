const fs = require("fs"), 
    { contextBridge, ipcRenderer } = require("electron"),
    brew = require("./brewAPI.js").brew;

localStorage.setItem('brewCache_hrefURL', null);

try {
    contextBridge.exposeInMainWorld("brew", brew);
} catch (e) {
    console.warn(`Failed to expose Brew API! This may result in some features not working!\n${e}`);
}

//ipcRenderer.send('selectDirectory');

async function loadThemes() {
    let themes = [];

    const Filehound = require('filehound'),
          path      = require("path");

    const source = path.join(__dirname, "..", "themes");

    const dir = await Filehound.create()
        .path(source)
        .directory()
        .find();

        for (subdirectories of dir) {
            try {
                let magic = fs.readFileSync(path.join(subdirectories, "themeinfo.json").toString());
                let temp = JSON.parse(magic);

                temp.license = path.join(subdirectories, temp.license);

                if (temp.type == "theme") {
                    temp.path = path.join(subdirectories, temp.path);
                } else if (temp.type == "windowicons") {
                    temp.path = path.join(subdirectories, temp.path);
                } else if (temp.type == "font") {
                    temp.regular = path.join(subdirectories, temp.regular);
                }
                themes.push(temp);
            } catch (error) {
            }
        }
    
    return themes;
}

document.addEventListener("DOMContentLoaded", async function() {
    let themes;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function pppSetup() {
        while (true) {
            if (brew.location.href() == "setupStage2.html") {
                if (!(document.getElementById("setup").innerHTML.includes("String sucessfully compiled."))) {
                    let str = [];
                
                    for (themeJSON of themes) {
                        let license = `--------Copyright information for ${themeJSON.name}\n\n` + fs.readFileSync(themeJSON.license).toString();
    
                        str.push(license);
                    }
    
                    let htmlPatch = str.join("\n\n") + "\n\nConcrete: String sucessfully compiled, with 0 errors.";
                    htmlPatch = htmlPatch.replaceAll("\n", "<br>");
                    document.getElementById("setup").innerHTML = htmlPatch;
                }
            }
            await sleep(2000);
        }
    }

    async function loadKeybindings() {
        const {ipcRenderer} = require('electron')

        ipcRenderer.on('reload', (event, arg) => {
            if (localStorage.getItem("initalSetup") == "true") {
                brew.location.reload();
            }
         })

         ipcRenderer.on('refresh', (event, arg) => {
            window.location.reload();
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

        brew.location.replaceHTML(htmlData);
    }

    async function loadTitle() {
        while (true) {
            document.getElementById("editorTitle").innerHTML = document.title;
            await sleep(50);
        }
    }

    themes = await loadThemes();

    await loadInit();
    await require("./renderer.js");
    loadTitle();
    pppSetup();

    ipcRenderer.send('ready');

    await loadKeybindings();
}) 