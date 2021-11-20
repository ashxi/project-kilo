const VERSION = JSON.parse(JSON.stringify(require("./global.json")))["version"]

module.exports = async function(commit, typer) {
    let type = typer.toLowerCase();
    const config = JSON.parse(JSON.stringify(require("./config.json")));

    if (config.validTypes.includes(type)) {
        let commitStr = commit.charAt(0).toUpperCase() + commit.slice(1);

        console.log(config.format.replace("TYPE", type).replace("COMMIT_DETAILS", commitStr).replace("VERSION", "UsefulCommit::Lint v" + VERSION))
    } else if (!config.isEnforced) {
        console.log("[WARN] Your commit type is not a valid type! Ignoring...")
    } else {
        console.log("[ERROR] Your commit type is not a valid type!")
        process.exit(1);
    }
}