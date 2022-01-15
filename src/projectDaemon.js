const brew = require("./brewAPI").brew,
    { contextBridge, ipcRenderer } = require("electron");

let currentFile = null;
let currentText = "";

async function main() {
    ipcRenderer.send("logging", "[projectDaemon.js] Project daemon loaded.");

    while (true) {
        await brew.misc.sleep(100);
    
        if (brew.location.href() == "project.html") {
            if (currentFile !== null) {
                document.title == "Concrete | " + currentFile;
            } else {
                document.title = "Concrete"
            }
    
            if (typeof localStorage.getItem("projectOpen") !== "object") {
                console.log("active!", localStorage.getItem("activeFile"));
                document.getElementsByClassName("pg-fix")[0].style.width = "calc(100% - 150px)";
                await brew.misc.sleep(200);
                let file = await brew.pj.getFile(localStorage.getItem("activeProject"), localStorage.getItem("activeFile"));
                currentText = file;
                currentFile = localStorage.getItem("activeFile");
                let syntaxHighlight = await brew.pj.syntaxHighlight(file);
      
                document.getElementById("main-text").innerHTML = syntaxHighlight;
                document.getElementsByClassName("pg-fix")[0].style.width = "0px";

                document.title = "Concrete | " + currentFile;

                localStorage.removeItem("projectOpen");
            }
            
            if (currentFile !== null) {
                let file = await brew.pj.getFile(localStorage.getItem("activeProject"), currentFile);

                if (file !== currentText) {
                    document.getElementsByClassName("pg-fix")[0].style.width = "calc(100% - 150px)";
                    await brew.misc.sleep(200);
                    document.getElementById("main-text").innerHTML = await brew.pj.syntaxHighlight(file);
                    document.getElementsByClassName("pg-fix")[0].style.width = "0px";

                    currentText = file;
                }
            }
        } else if (document.title.toString().startsWith("Concrete |")) {
            document.title = "Concrete";
        } else {
            try {
                localStorage.removeItem("projectOpen");
                localStorage.removeItem("activeFile");
            } catch (e) {
                console.warn(e);
            }
        }
    }
}

main();