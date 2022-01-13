const fs = require("fs"),
      hljs = require("highlight.js"),
      { ipcRenderer } = require("electron");

const config = JSON.parse(JSON.stringify(require("../config.json")));

const remote = require('@electron/remote');
const path = require("path");
const win = remote.getCurrentWindow();
const dialog = remote.dialog;

// Override if it is dev mode, and if bypass config is enabled.
const override = config.isDevMode && config.bypassConfig;

/**
 * lazy loads syntax highlighting, <script> tags, and <title> tags
 * @param {string} data HTML data to lazyload
 */
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

/**
 * Not documented because this is internal data. 
 * Quirks for specific web pages to render correctly
 */
const concreteQuirks = {
    DOMPatches: {
        setup: async function() {
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
        projectSelector: async function() {
            const projectTemplate = `<a href="#" onclick="brew.pj.prompt.openProject('Project1');">Project1</a><br>`;
            try {
                for await(data of JSON.parse(localStorage.getItem("projects"))) document.getElementById("listOfProjects").innerHTML += projectTemplate.replaceAll("Project1", data.name);
            } catch (e) {
                brew.misc.crash("Error loading license files: " + e);
            }

            document.getElementById("listOfProjects").innerHTML += `<br><button style="background-color: var(--third-background);" onclick="brew.location.replace('index.html')" class="pure-material-button-contained">Go Back</button>`;
        }
    }
}

/**
 * brew is an api for bedrock to access various different utilities.
 * 
 * to extend brew, just set a child of brew (brew.child) to a function.
 * 
 * you can also override default functions using brew.<functionname>.
 */
const brew = {
    /**
     * misc brew utilities, such as loading themes or sleep a certain amount of time.
     */
    misc: {
        /**
         * loads all themes into an array, which are objects and have a path (or regular) property.
         * 
         * it can be 3 different types - Theme, Window Icons, or Font
         * 
         * if a font, instead of using object.path, you would use object.regular to get the path to the font.
         * 
         * object.path is the path to the theme/window icons
         * 
         * all of them have multiple different values:
         * 
         * name - name of the font/theme/window-icons
         * 
         * shortName - shorthand of name
         * 
         * license - relative path to the license from the font/theme/window-icons' parent folder
         * 
         * isPreInstalled - whether or not the font/theme/window-icon set is pre-installed
         * 
         * type - type of thing the object is. can either bew font, theme, or windowicons
         * 
         * @returns {[]} array of themes, fonts, and window-icons
         */
        loadThemes: async function() {
            let themes = [];
        
            const Filehound = require('filehound'),
                  fs = require("fs"),
                  path      = require("path");
        
            const source = path.join(__dirname, "..", "themes"),
                  dir = await Filehound.create()
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
        },
        /**
         * returns a promise with a callback of setTimeout for ms milliseconds.
         * @param {Number} ms number of milliseconds to sleep
         * @returns {Promise} promise that waits for a set-timeout to finish
         */
        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        /**
         * crashes app with choice of message.
         * @param {string} message message to send to event handler to crash with
         */
        crash: async function(message) {
            return(await ipcRenderer.send("error", message));
        },
        
    },
    /**
     * custom location api, which uses fast methods
     */
    location: {
        /**
         * replaces html with specified data, in a optimized manner.
         * @param {string} origData RAW html data
         * @param {boolean} ignore2 bypasses setup lock if true
         */
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
    /**
     * replaces html with a specified file, in a optimized manner.
     * @param {string} url 
     */
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
    /**
     * reloads in a optimized manner.
     */
    reload: function() {
        brew.location.replace(brew.location.href());
    },
    /**
     * restarts the app.
     */
    restart: function() {
        ipcRenderer.send("restart");
    },
    /**
     * gets the current virtual url.
     * @returns {string} the current url
     */
    href: function() {
        let cache = localStorage.getItem("brewCache_hrefURL");
        
        if (cache == 'null') {
            localStorage.setItem("brewCache_hrefURL", window.location.href.split("/")[window.location.href.split("/").length-1]);
            return(window.location.href.split("/")[window.location.href.split("/").length-1]);
        }

        return(cache);
    }
  },
  /**
   * utilities that give information about brew.
   */
  homebrew: {
      /**
       * gives version information for the brew api
       * @param {boolean} isSilent boolean to determine if the function should be silent or not
       * @returns version of brew API
       */
      aboutBrew: function(isSilent) {
          if (!isSilent) {
            console.log(`Running Brew ${brew.homebrew.brewVer}, by Bedrock Team.`);
          }
          return(brew.homebrew.brewVer);
      },
      brewVer: JSON.parse(JSON.stringify(require("../package.json")))["version"]
  },
  /**
   * API for projects
   */
  pj: {
      /**
       * API for prompts for projects
       */
      prompt: {
          /**
           * dependencies for prompts
           */
          deps: {
              /**
               * opens folder selection prompt, and returns output
               * @returns {Promise} promise that resolves to a directory path
               */
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
          /**
           * adds project from prompt
           */
          addProject: async function() {
              let folders = await brew.pj.prompt.deps.folderPrompt();
              let pathFolders = folders.filePaths[0];
              let name = pathFolders.replaceAll("\\", "/").split("/").pop();

              await brew.pj.add(name, pathFolders);
              await localStorage.setItem("activeProject", name);
              await brew.location.replace("project.html");
          },
          /**
           * opens project if valid in app
           * @param {string} name name of project
           */
          openProject: async function(name) {
              let isValidProject = false;

              for await(data of JSON.parse(localStorage.getItem("projects"))) {
                if (data.name == name) {
                    isValidProject = true;
                    break;
                }
              }

              if (!isValidProject) {
                  throw("Invalid Project")
              }

              localStorage.setItem("activeProject", name);
              brew.location.replace("project.html");
          }
      },
      /**
       * adds project without using prompt, optimal for scripting
       * @param {string} name the name of the project
       * @param {string} path the path to the project
       */
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
      /**
       * sets the current active project, needed when opening project.html
       * @param {string} name name of project
       */
      setActiveProject: function(name) {
          localStorage.setItem("activeProject", name);
      },
      /**
       * returns list of files and folders in a project
       * @param {string} name name of project to search
       * @param {string} subdir optional, subdirectory to list files in
       * @returns list of files in project directory
       */
      listFiles: async function(name, subdir) {
          let isValidProject = false;
          let pathProject = "";
  
          for await(data of JSON.parse(localStorage.getItem("projects"))) {
            if (data.name == name) {
                isValidProject = true;
                pathProject = data.path;
                break;
            }
          }
  
          if (!isValidProject) {
              throw("Invalid Project")
          }

          if (typeof subdir == "string") {
            return(fs.readdirSync(path.join(pathProject, subdir)));
          } else {
            return(fs.readdirSync(pathProject));
          }
      }
  }
}

// Give brew to the exports
exports.brew = brew;