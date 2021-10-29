document.addEventListener("DOMContentLoaded", function() {
    require('./renderer.js')
})

document.addEventListener("DOMContentLoaded", function() {
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