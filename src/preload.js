document.addEventListener("DOMContentLoaded", function(event) {
    require('./renderer.js')
})

document.addEventListener("DOMContentLoaded", function(event) {
    async function main() {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        while (true) {
            document.getElementById("editorTitle").innerHTML = document.title;
            await sleep(50);
        }
    }

    main()
})