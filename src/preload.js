const fs = require("fs");
const { contextBridge } = require("electron")

let brew = { location: {
    replaceHTML: function(data) {
        document.getElementById("mainWindow").innerHTML = data;
        
        const html = new DOMParser().parseFromString(data, 'text/html');
        let doc = html.getElementsByTagName('script');
        let title = html.getElementsByTagName('title');
            
        for (docs of doc) {
            eval(docs.innerHTML);
        }

        for (newTitle of title) {
            document.title = newTitle.innerHTML;
        }
    },
    replace: function(url) {
        const data = fs.readFileSync(`${__dirname}/${url}`, {encoding:'utf8', flag:'r'});

        brew.location.replaceHTML(data);
    },
    reload: function() {
        let splitter = window.location.href.split("/");
    
        brew.location.replace(splitter[splitter.length - 1]);
    }
  },
  homebrew: {
      aboutBrew: function() {
          console.log(`Running Brew ${brew.homebrew.brewVer}, by Bedrock Team.`);
          return(true);
      },
      brewVer: "0.1a"
  }
};

contextBridge.exposeInMainWorld("brew", brew);

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

document.addEventListener("DOMContentLoaded", async function() {
    document.body.style.backgroundColor = "#344b4b";
    document.body.style.color = "#344b4b";

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

        document.body.innerHTML = data + `<div id="mainWindow" class="main"></div>`;
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
    await loadTitle();

    main();
}) 