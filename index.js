const { app, BrowserWindow } = require('electron')
const path = require("path");
const fs = require("fs");

const createWindow = () => {
  const win = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: true, 
      preload: "./preload/index.js"
    }
  })

  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  createWindow()
})