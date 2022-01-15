/*
  Code for initalizing window buttons on Windows.
  
  Copyright (c) 2021 Concrete Team
  Licensed under the MIT License (MIT).
  Happy Coding! :^)
*/

// Loads logging capabilities.
const { contextBridge, ipcRenderer } = require("electron");

// Loads remote window, to manage.
const remote = require('@electron/remote');
const win = remote.getCurrentWindow();

// Calls the window handler.
handleWindowControls();

// Before the window gets unloaded, remove all event listeners.
window.onbeforeunload = (event) => {
    win.removeAllListeners();
}

ipcRenderer.send("logging", "[renderer.js] Renderer initializing...");

// Main function, only called on Windows.
// When called on macOS or Linux, error out.
function handleWindowControls() {
    // When the minimized button is pressed, minimize the window. 
    ipcRenderer.send("logging", "[renderer.js] Activated button handler...");
    try {
        document.getElementById('min-button').addEventListener("click", event => {
            ipcRenderer.send("logging", "[renderer.js] Minimizing window...");
            win.minimize();
        });
    } catch (e) {
        ipcRenderer.send("logging", '[renderer.js] Failed to add event listener for the minimize button.')
    }

    // When the maximized button is pressed, maximize the window.
    try {
        document.getElementById('max-button').addEventListener("click", event => {
            ipcRenderer.send("logging", "[renderer.js] Maximizing window...");
            win.maximize();
            document.body.classList.add('maximized');
        });
    } catch (e) {
        ipcRenderer.send("logging", '[renderer.js] Failed to add event listener for the maximize button.')   
    }

    // When the un-maximized button is pressed, un-maximize the window.
    try {
        document.getElementById('restore-button').addEventListener("click", event => {
            ipcRenderer.send("logging", "[renderer.js] Restoring window...");
            win.unmaximize();
            document.body.classList.remove('maximized');
        });
    } catch (e) {
        ipcRenderer.send("logging", '[renderer.js] Failed to add event listener for the restore button.')
    }

    // When the close button is pressed, close the window.
    try {
        document.getElementById('close-button').addEventListener("click", event => {
            ipcRenderer.send("logging", "[renderer.js] Closing window...");
            win.close();
        });
    } catch (e) {
        ipcRenderer.send("logging", '[renderer.js] Failed to add event listener for the close button.')
    }
}

ipcRenderer.send("logging", "[renderer.js] Renderer initialized.");