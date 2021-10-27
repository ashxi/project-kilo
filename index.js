const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true, // importnat
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: true //for forcing full screen
    }
  })

  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  createWindow()
})