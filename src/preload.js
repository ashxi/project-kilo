const fs = require("fs");
const { contextBridge, ipcRenderer } = require("electron")

async function loadThemes() {
    let themes = [];

    const Filehound = require('filehound'),
          path  = require("path");

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
                    temp.path = path.join(subdirectories, temp.license);
                } else if (temp.type == "windowicons") {
                    temp.path = path.join(subdirectories);
                } else if (temp.type == "font") {
                    temp.regular = path.join(subdirectories, temp.regular);
                }
                themes.push(temp);
            } catch (error) {
            }
        }
    
    return themes;
}

document.addEventListener("DOMContentLoaded", function() {
    document.body.style.backgroundColor = "#344b4b";
    document.body.style.color = "#344b4b";

    async function main() {
        let themes = [];
        async function loadInit() {
            const data = fs.readFileSync(__dirname + "/base.html", {encoding:'utf8', flag:'r'});

            let htmlData = "";
            let themePath = "",
                fontPath = "",
                windowiconsPath = "";
            
            if (localStorage.getItem("initalSetup") != true) {
                localStorage.setItem("theme", "default");
                localStorage.setItem("font", "fira-code");
                localStorage.setItem("windowicons", "vscode-fluent-icons");

                htmlData = fs.readFileSync(__dirname + "/setup.html", {encoding:'utf8', flag:'r'});
            } else {
               htmlData = document.body.innerHTML;
            }

            document.body.innerHTML = data + `<div class="main">` + htmlData + `</div>`;
            document.body.style.color = "white";

            var doc = new DOMParser().parseFromString(htmlData, 'text/html').getElementsByTagName('script');
            
            for (doc of doc) {
                eval(doc.innerHTML);
            }
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
        loadTitle();
        console.log("Loaded");
        await require("./renderer.js");
    }

    main();
}) 