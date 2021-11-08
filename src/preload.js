const fs = require("fs"), 
    { contextBridge, ipcRenderer } = require("electron"),
    brew = require("./brewAPI.js").brew;

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
                    temp.path = subdirectories;
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
    document.body.style.backgroundColor = "#344b4b";
    document.body.style.color = "#344b4b";

    let themes;

    async function loadKeybindings() {
        const {ipcRenderer} = require('electron')

        ipcRenderer.on('reload', (event, arg) => {
            brew.location.reload();
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
            
        if (localStorage.getItem("initalSetup") != true) {
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
                  if (themeJSON.shortname == localStorage.getItem("font")) {
                      paths[1] = themeJSON.regular;
                  }

                if (themeJSON.shortname == "fira-code") {
                    defaults[1] = themeJSON.regular;
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
        let font = await fs.readFileSync(paths[1], {encoding:'utf8', flag:'r'});
        let windowicons = paths[2];

        

        document.body.innerHTML = `${data}<style>${theme}</style><div id="mainWindow" class="main"></div>`;
        document.body.style.backgroundColor = "#2a3c3c";
        document.body.style.color = "white";

        brew.location.replaceHTML(htmlData);
    }

    async function loadTitle() {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        while (true) {
            document.getElementById("editorTitle").innerHTML = document.title;
            await sleep(50);
        }
    }

    themes = await loadThemes();

    await loadInit();
    await require("./renderer.js");
    loadTitle();
    await loadKeybindings();
}) 