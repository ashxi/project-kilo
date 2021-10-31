exports.brew = { 
    location: {
      replaceHTML: function(data) {
        document.getElementById("mainWindow").innerHTML = data;
        
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
};