const brew = require("../src/brewAPI.js").brew,
      { contextBridge, ipcRenderer } = require("electron"),
      axios = require('axios'),
      fs = require('fs'),
      unzipper = require('unzipper'),
      clone = require('git-clone/promise');

ipcRenderer.send("logging", "[installerlib] Package installer initializing...");

function extractDir(dir, dest) {
    return new Promise((resolve, reject) => {
        try {
            fs.createReadStream(dir).pipe(unzipper.Extract({ path: dest })).on('close', () => {
                resolve();
            });
        } catch (e) {
            reject(e);
        }
    })
}

async function main() {

    await require("../src/renderer.js");
    document.getElementById("editorTitle").innerHTML = "Installing Dependencies..."

    document.title = "Installing Dependencies...";

    await installPackages();
}

let packages = [{
    name: "Fira Code",
    install: async function(tmp) {
        progressBar(0);
        let data = await axios.get("https://api.github.com/repos/tonsky/FiraCode/releases/latest")
        data = await axios.request({
            method: 'GET',
            url: data.data.assets[0].browser_download_url,
            responseType: 'arraybuffer',
            responseEncoding: 'binary'
          }, {
            onUploadProgress: function(progressEvent) {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                progressBar(percentCompleted);
              }
          });
        progressBar(0);
        await fs.writeFileSync(tmp + "/FiraCode.zip", Buffer.from(data.data, 'binary'));
        progressBar(50);
        await extractDir(tmp + "/FiraCode.zip", tmp + "/Fira")
        progressBar(100);
        await fs.renameSync("tmp/Fira/ttf/FiraCode-Regular.ttf", "themes/fonts/Fira Code/FiraCode-Regular.ttf");
    }
}, {
    name: "Open Sans",
    install: async function() {
        progressBar(0);
        data = await axios.request({
            method: 'GET',
            url: "https://raw.githubusercontent.com/googlefonts/opensans/main/fonts/ttf/OpenSans-Regular.ttf",
            responseType: 'arraybuffer',
            responseEncoding: 'binary'
          }, {
            onUploadProgress: function(progressEvent) {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                progressBar(percentCompleted);
              }
          })
        
        progressBar(0);
        
        await fs.writeFileSync("src/gfonts/ops1.ttf", Buffer.from(data.data, 'binary'));

        progressBar(100);
    }
}, {
    name: "VSCode Icons",
    install: async function(tmp) {
        progressBar(null);
    
        try {
            await clone("https://github.com/vscode-icons/vscode-icons.git", tmp + "/vscode-icons");
            await fs.renameSync(tmp + "/vscode-icons/icons/", "themes/icons/vscode-fluent-icons/src/");
        } catch (e) {
            console.warn(e);
        }
    }
}, {
    name: "Licenses",
    install: async function() {
        data = await axios.get("https://raw.githubusercontent.com/tonsky/FiraCode/master/LICENSE", "", {
            onUploadProgress: function(progressEvent) {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                progressBar(Math.round(percentCompleted/2));
              }
          });

        await fs.writeFileSync("themes/fonts/Fira Code/license.txt", data.data);

        data = await axios.get("https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/LICENSE", "", {
            onUploadProgress: function(progressEvent) {
                var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
                progressBar(Math.round(percentCompleted/2) + 50);
              }
          });

        await fs.writeFileSync("themes/icons/vscode-fluent-icons/license.txt", data.data);
    }
}];

let updatePkgs = [{
    name: "check",
    install: async function(tmp) {
        
    }
}];

async function getPackageList() {
    if (false) return updatePkgs; // not working for now
    return packages;
}

async function progressBar(prog) {
    if (prog == null) {
        document.getElementById("progress-bar").style.width = null;
        document.getElementById("progress-bar").className = "indeterminate";
    } else {
        document.getElementById("progress-bar").style.width = prog + "%";
        document.getElementById("progress-bar").className = "determinate";
    }
} 

async function installPackages() {
    try {
        await fs.mkdirSync("./tmp");
    } catch (e) {
        await fs.rmdirSync("./tmp", { recursive: true });
        try {
            await fs.mkdirSync("./tmp");
            try {
                await fs.rmdirSync("themes/icons/vscode-fluent-icons/src", { recursive: true });
            } catch (e) {
                console.log(e);
            }
        } catch (e) {
            ipcRenderer.send("logging", "[installerlib] Error creating tmp directory: " + e);
            await ipcRenderer.send("finished-setup");
        }
    }

    progressBar(0);

    for await (let package of await getPackageList()) {
        document.getElementById("package-name").innerHTML = package.name;
        ipcRenderer.send("logging", "[installerlib] Installing " + package.name);
        try {
            await package.install("./tmp");
            ipcRenderer.send("logging", "[installerlib] Installed " + package.name);
        } catch (e) {
            crash("[installerlib] Error installing " + package.name + ": " + e);
        }
    }

    await fs.rmdirSync("./tmp", { recursive: true });
    await fs.writeFileSync("./isSetup.txt", "true");
    await ipcRenderer.send("finished-setup");
}

document.addEventListener("DOMContentLoaded", main);