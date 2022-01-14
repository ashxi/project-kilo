const brew = require("../src/brewAPI.js").brew,
      { contextBridge, ipcRenderer } = require("electron"),
      axios = require('axios'),
      fs = require('fs'),
      unzipper = require('unzipper'),
      clone = require('git-clone/promise');

ipcRenderer.send("logging", "[preload.js||installerlib] Package installer initializing...");

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
    if (process.platform !== "win32") {
        document.querySelector(':root').style.setProperty('--titlebar-height', '0px');
        document.querySelector(':root').style.setProperty('--rounded-corners', '0px');
        document.querySelector(':root').style.setProperty('--linux-height', '0px');
        document.querySelector(':root').style.setProperty('--secondary-background', '#344b4b');
    } else {
        await require("../src/renderer.js");
        document.getElementById("editorTitle").innerHTML = "Installing Dependencies..."
    }

    document.title = "Installing Dependencies...";

    await installPackages();
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
            ipcRenderer.send("logging", "[preload.js||installerlib] Error creating tmp directory: " + e);
            await ipcRenderer.send("finished-setup");
        }
    }
    document.getElementById("package-name").innerHTML = "Fira Code";
    let data = await axios.get("https://api.github.com/repos/tonsky/FiraCode/releases/latest")
    data = await axios.request({
        method: 'GET',
        url: data.data.assets[0].browser_download_url,
        responseType: 'arraybuffer',
        responseEncoding: 'binary'
      })
    await fs.writeFileSync("tmp/FiraCode.zip", Buffer.from(data.data, 'binary'));

    await extractDir("tmp/FiraCode.zip", "tmp/Fira")
    fs.readdirSync("tmp/").forEach(file => {
        console.log(file);
    });

    await fs.renameSync("tmp/Fira/ttf/FiraCode-Regular.ttf", "themes/fonts/Fira Code/FiraCode-Regular.ttf");

    document.getElementById("package-name").innerHTML = "Open Sans";
    data = await axios.request({
        method: 'GET',
        url: "https://raw.githubusercontent.com/googlefonts/opensans/main/fonts/ttf/OpenSans-Regular.ttf",
        responseType: 'arraybuffer',
        responseEncoding: 'binary'
      })
    
    await fs.writeFileSync("src/gfonts/ops1.ttf", Buffer.from(data.data, 'binary'));

    document.getElementById("package-name").innerHTML = "VSCode Icons";
    await clone("https://github.com/vscode-icons/vscode-icons.git", "tmp/vscode-icons");
    
    try {
        await fs.renameSync("tmp/vscode-icons/icons/", "themes/icons/vscode-fluent-icons/src/");
    } catch (e) {
        console.warn(e);
    }

    document.getElementById("package-name").innerHTML = "Licenses";

    data = await axios.get("https://raw.githubusercontent.com/tonsky/FiraCode/master/LICENSE");
    await fs.writeFileSync("themes/fonts/Fira Code/license.txt", data.data);

    data = await axios.get("https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/LICENSE");
    await fs.writeFileSync("themes/icons/vscode-fluent-icons/license.txt", data.data);

    document.getElementById("package-name").innerHTML = "finishd";
    await fs.rmdirSync("./tmp", { recursive: true });
    await fs.writeFileSync("./isSetup.txt", "true");
    await ipcRenderer.send("finished-setup");
}

document.addEventListener("DOMContentLoaded", main);