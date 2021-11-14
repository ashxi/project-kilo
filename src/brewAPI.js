const fs = require("fs"),
      hljs = require("highlight.js"),
      path = require("path"),
      { contextBridge, ipcRenderer } = require("electron");

const remote = require('@electron/remote');
const win = remote.getCurrentWindow();
const dialog = remote.dialog;

const override = false;

const brew = { 
    location: {
      replaceHTML: function(origData, ignore2) {
        let setupOverride;

        if (ignore2 == true) {
            setupOverride = true;
        } else {
            setupOverride = override;
        }

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

        let data = origData;
        
        if (localStorage.getItem("initialSetup") != "true" && !setupOverride) {
            data = fs.readFileSync(__dirname + "/setup.html", {encoding:'utf8', flag:'r'});
        }

        data += "<br>";
        document.getElementById("mainWindow").innerHTML = data;

        lazyLoad(data);
    },
    replace: function(url) {
        const data = fs.readFileSync(`${__dirname}/${url}`, {encoding:'utf8', flag:'r'});
        localStorage.setItem("brewCache_hrefURL", url);

        if (url == "setupStage2.html" || url == "setupStage3.html") {
            brew.location.replaceHTML(data, true);
        } else {
            brew.location.replaceHTML(data);
        }
    },
    reload: function() {
        let splitter = window.location.href.split("/");
    
        brew.location.replace(splitter[splitter.length - 1]);
    },
    restart: function() {
        ipcRenderer.send("restart");
    },
    href: function() {
        let cache = localStorage.getItem("brewCache_hrefURL");
        
        if (cache == null) {
            localStorage.setItem("brewCache_hrefURL", window.location.href.split("/")[window.location.href.split("/").length-1]);
            return(window.location.href.split("/")[window.location.href.split("/").length-1]);
        }

        return(cache);
    }
  },
  homebrew: {
      aboutBrew: function() {
          console.log(`Running Brew ${brew.homebrew.brewVer}, by Bedrock Team.`);
          return(true);
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