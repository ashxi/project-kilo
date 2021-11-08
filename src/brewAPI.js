const fs = require("fs"),
      hljs = require("highlight.js");

const setupOverride = true;

const brew = { 
    location: {
      replaceHTML: function(origData) {
        let data = origData;
        if (localStorage.getItem("initalSetup") != true && !setupOverride) {
            data = fs.readFileSync(__dirname + "/setup.html", {encoding:'utf8', flag:'r'});
        }

        data += "<br>";
        document.getElementById("mainWindow").innerHTML = data;
        
        for (coding of document.getElementsByClassName('code')) {
            coding.innerHTML = hljs.highlightAuto(coding.innerHTML).value;  
        }
        
        const html = new DOMParser().parseFromString(data, 'text/html');
        let doc = html.getElementsByTagName('script');
        let title = html.getElementsByTagName('title');
            
        for (docs of doc) {
            eval(docs.innerHTML);
        }

        for (newTitle of title) {
            document.title = newTitle.innerHTML;
        }
    },
    replace: function(url) {
        const data = fs.readFileSync(`${__dirname}/${url}`, {encoding:'utf8', flag:'r'});

        brew.location.replaceHTML(data);
    },
    reload: function() {
        let splitter = window.location.href.split("/");
    
        brew.location.replace(splitter[splitter.length - 1]);
    }
  },
  homebrew: {
      aboutBrew: function() {
          console.log(`Running Brew ${brew.homebrew.brewVer}, by Bedrock Team.`);
          return(true);
      },
      brewVer: JSON.parse(JSON.stringify(require("../package.json")))["version"]
  }
}

exports.brew = brew;