require('dotenv').config();
const { app, BrowserWindow } = require('electron');
const path = require('path');

require(path.join(__dirname, 'app.js'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  const port = process.env.PORT || 3000;
  win.loadURL(`http://localhost:${port}`);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
