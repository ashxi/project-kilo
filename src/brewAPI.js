const fs = require("fs"),
      hljs = require("highlight.js"),
      { ipcRenderer } = require("electron");

const config = JSON.parse(JSON.stringify(require("../config.json")));

const remote = require('@electron/remote');
const win = remote.getCurrentWindow();
const dialog = remote.dialog;

const override = config.isDevMode && config.bypassConfig;

async function lazyLoad(data) {
    const html = new DOMParser().parseFromString(data, 'text/html');
    let doc = html.getElementsByTagName('script');
    let title = html.getElementsByTagName('title');

    for (docs of doc) {
        eval(docs.innerHTML);
    }

    for (newTitle of title) {
        document.title = newTitle.innerHTML;
    }

    for (coding of document.getElementsByClassName('code')) {
        let temp = hljs.highlightAuto(coding.innerHTML).value;
        console.log(temp);
        coding.innerHTML = temp;  
    }
}

const concreteQuirks = {
    "DOMPatches": {
        "setup": async function() {
            const themes = await brew.misc.loadThemes();
            
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
        },
        "projectSelector": async function() {
            const projectTemplate = `<a href="#" onclick="brew.pj.prompt.openProject('Project1');">Project1</a><br>`;
            for await(data of JSON.parse(localStorage.getItem("projects"))) {
                document.getElementById("listOfProjects").innerHTML += projectTemplate.replaceAll("Project1", data.name);
            }

            document.getElementById("listOfProjects").innerHTML += `<br><button style="background-color: var(--third-background);" onclick="brew.location.replace('index.html')" class="pure-material-button-contained">Go Back</button>`;
        }
    }
}

const brew = {
    "misc": {
        "loadThemes": async function() {
            const fs = require("fs"), 
                  { contextBridge, ipcRenderer } = require("electron");
            
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
    },
    location: {
      replaceHTML: async function(origData, ignore2) {
        let setupOverride;

        if (ignore2 == true) {
            setupOverride = true;
        } else {
            setupOverride = override;
        }

        let data = origData;
        
        if (localStorage.getItem("initialSetup") != "true" && !setupOverride) {
            data = fs.readFileSync(__dirname + "/setup.html", {encoding:'utf8', flag:'r'});
        }

        data += "<br>";
        document.getElementById("mainWindow").innerHTML = data;

        lazyLoad(data);
    },
    replace: async function(url) {
        const data = fs.readFileSync(`${__dirname}/${url}`, {encoding:'utf8', flag:'r'});
        localStorage.setItem("brewCache_hrefURL", url);

        if (url == "setupStage2.html" || url == "setupStage3.html") {
            await brew.location.replaceHTML(data, true);
            if (url == "setupStage2.html") {
                concreteQuirks.DOMPatches.setup();
            }
        } else if (url == "projectselector.html") {
            await brew.location.replaceHTML(data);
            concreteQuirks.DOMPatches.projectSelector();
        } else {
            brew.location.replaceHTML(data);
        }
    },
    reload: function() {
        brew.location.replace(brew.location.href());
    },
    restart: function() {
        ipcRenderer.send("restart");
    },
    href: function() {
        let cache = localStorage.getItem("brewCache_hrefURL");
        
        if (cache == 'null') {
            localStorage.setItem("brewCache_hrefURL", window.location.href.split("/")[window.location.href.split("/").length-1]);
            return(window.location.href.split("/")[window.location.href.split("/").length-1]);
        }

        return(cache);
    }
  },
  homebrew: {
      aboutBrew: function(isSilent) {
          if (!isSilent) {
            console.log(`Running Brew ${brew.homebrew.brewVer}, by Bedrock Team.`);
          }
          return(brew.homebrew.brewVer);
      },
      brewVer: JSON.parse(JSON.stringify(require("../package.json")))["version"]
  },
  pj: {
      prompt: {
          deps: {
               folderPrompt: async function() {
                  const dir = await dialog.showOpenDialog(win, {
                      properties: ['openDirectory']
                  });
            
                  if (!dir.canceled) {
                      return(dir);
                  } else {
                      return(null);
                  }
               }
          },
          addProject: async function() {
              let folders = await brew.pj.prompt.deps.folderPrompt();
              let pathFolders = folders.filePaths[0];
              let name = pathFolders.replaceAll("\\", "/").split("/").pop();

              await brew.pj.add(name, pathFolders);
              await localStorage.setItem("activeProject", name);
              await brew.location.replace("project.html");
          },
          openProject: async function(name) {
              let isValidProject = false;

              for await(data of JSON.parse(localStorage.getItem("projects"))) {
                if (data.name == name) {
                    isValidProject = true;
                    break;
                }
              }

              if (!isValidProject) {
                  return(new Error("Invalid Project"))
              }

              localStorage.setItem("activeProject", name);
              brew.location.replace("project.html");
          }
      },
      add: async function(name, path) {
            let projects = [];
            if (localStorage.getItem("projects") != null) {
                projects = JSON.parse(localStorage.getItem("projects"));
            } else {
                projects = [];
            }

            let project = {
                name: name,
                path: path
            }
    
            projects.push(project);
            localStorage.setItem("projects", JSON.stringify(projects));
      },
      setActiveProject: function(name) {
          localStorage.setItem("activeProject", name);
      }
  }
}

exports.brew = brew;