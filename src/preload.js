document.addEventListener("DOMContentLoaded", function() {
    async function main() {
        async function loadInit() {
            document.body.style.backgroundColor = "#344b4b";
            const fs = require("fs");

            const data = fs.readFileSync(__dirname + "/base.html", {encoding:'utf8', flag:'r'});
            let otherData = document.body.innerHTML;
            document.body.innerHTML = data + `<div class="main">` + otherData + `</div>`;
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

        function loadRenderer() {
            require('./renderer.js');
        }

        await loadInit();
        await loadRenderer();
        await loadTitle();
    }

    main();
}) 