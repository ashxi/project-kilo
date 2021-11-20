const VERSION = JSON.parse(JSON.stringify(require("./global.json")))["version"]

console.log("UsefulCommit v" + VERSION);
console.log("Written by Greyson/creamy-dev, for Concrete.")
console.log("-----------------");
const command = ["--help", "--commit='commit name'", "--type='type of commit'", "--lint"];
const func = ["Lists help commands", "Commit name for linting", "Type for linting", "Lints commit and gives you a result"];

let position = 0;
command.forEach(async function(item) {
    console.log(`${item},  ${func[position]}`)
    position++;
}) 