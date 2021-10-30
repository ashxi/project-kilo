const fs = require("fs");

let themes = [];

function loadThemes() {
    themes = [];

    const Filehound = require('filehound'),
          path  = require("path");

    const source = path.join(__dirname, "..", "themes");

    Filehound.create()
        .path(source)
        .directory()
        .find((err, subdirectories) => {
            if (err) return console.error(err);
        
            for (subdirectories of subdirectories) {
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
                } catch (error) {}
            }
          });
}

document.addEventListener("DOMContentLoaded", function() {
    async function main() {
        async function loadInit() {
            document.body.style.backgroundColor = "#344b4b";

            const data = fs.readFileSync(__dirname + "/base.html", {encoding:'utf8', flag:'r'});
            let htmlData = "";
            if (localStorage.getItem("initalSetup") !== true) {
                htmlData = fs.readFileSync(__dirname + "/setup.html", {encoding:'utf8', flag:'r'});
            } else {
               htmlData = document.body.innerHTML;
            }

            document.body.innerHTML = data + `<div class="main">` + htmlData + `</div>`;

            var doc = new DOMParser().parseFromString(htmlData, 'text/html').getElementsByTagName('script');
            
            for (doc of doc) {
                eval(doc.innerHTML)
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

        await loadThemes();
        await loadInit();
        await require('./renderer.js');
        await loadTitle();
    }

    main();
}) 