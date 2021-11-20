const VERSION = JSON.parse(JSON.stringify(require("./global.json")))["version"]

module.exports = async function(commit, typer) {
    const config = JSON.parse(JSON.stringify(require("./config.json")));
    let type = typer.toLowerCase();
    function genCommit(commit, typer) {
        let commitStr = commit.charAt(0).toUpperCase() + commit.slice(1);

        console.log(config.format.replace("TYPE", type).replace("COMMIT_DETAILS", commitStr).replace("VERSION", "UsefulCommit::Lint v" + VERSION))
    }

    if (config.validTypes.includes(type)) {
        genCommit(commit, typer);
    } else if (!config.isEnforced) {
        console.log("(UsefulCommit::Lint) [WARN] Your commit type is not a valid type! Ignoring...")
        genCommit(commit, typer)
    } else {
        console.log("(UsefulCommit::Lint) [ERROR] Your commit type is not a valid type!")
        process.exit(1);
    }
}