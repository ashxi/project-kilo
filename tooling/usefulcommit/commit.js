const VERSION = JSON.parse(JSON.stringify(require("./global.json")))["version"]

module.exports = async function(commit, typer) {
    const config = JSON.parse(JSON.stringify(require("./config.json")));
    let type = typer.toLowerCase();
    async function genCommit(commitOrig, typer) {
        let commitStr = commitOrig.charAt(0).toUpperCase() + commitOrig.slice(1);
        let commit = config.format.replace("TYPE", type).replace("COMMIT_DETAILS", commitStr).replace("VERSION", "UsefulCommit::Lint v" + VERSION);

        let punc = ["!", "."] // Actual things to end your sentence with that DOES make sense.
        // TODO: Add more punctuation.

        let commitTest = false;

        for await(punctuation of punc) {
            if (commit.endsWith(punctuation)) {
                commitTest = true;
            }
        }

        if (!commitTest) {
            commit += ".";
        }

        return(commit);
    }

    if (config.validTypes.includes(type)) {
        console.log(await genCommit(commit, typer));
    } else if (!config.isEnforced) {
        console.log("(UsefulCommit::Lint) [WARN] Your commit type is not a valid type! Ignoring...")
        console.log(await genCommit(commit, typer));
    } else {
        console.log("(UsefulCommit::Lint) [ERROR] Your commit type is not a valid type!")
        process.exit(1);
    }
}