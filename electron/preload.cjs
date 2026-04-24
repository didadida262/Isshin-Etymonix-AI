const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 应用信息
  getAppInfo: () => ({
    platform: process.platform,
    version: process.versions.electron,
  }),

  // 窗口控制
  window: {
    close: () => ipcRenderer.send('window-close'),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    toggleMaximize: () => ipcRenderer.send('window-toggle-maximize'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // 如果需要发送消息到主进程
  send: (channel, data) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // 如果需要接收来自主进程的消息
  receive: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});

console.log('Electron preload script loaded');
