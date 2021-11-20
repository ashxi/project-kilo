argvBefore = process.argv;
argvBefore.shift();
argvBefore.shift();

const argv = argvBefore;
delete argvBefore;

let isLinting = false, commit = "", type = "";
if (argv.toString() == "") { //what the hell
    console.log("(UsefulCommit) No arguments provided! Showing help page.")
    require(__dirname + "/help.js");
} else {
    argv.forEach(async function(arg) {
        if (arg.toLowerCase().startsWith("--help")) {
            require(__dirname + "/help.js");
            process.exit(0);
        } else if (arg.toLowerCase().startsWith("--lint")) {
            isLinting = true;
        } else if (arg.toLowerCase().startsWith("--commit")) {
            commit = arg.split("=")[1];
        } else if (arg.toLowerCase().startsWith("--type")) {
            type = arg.split("=")[1];
        }
    });

    if (isLinting) {
        if (commit != "" && type != "") {
            require(__dirname + "/commit.js")(commit, type)
        } else {
            console.log("(UsefulCommit::Lint) [ERROR] Missing arguments!")
        }
    }
}