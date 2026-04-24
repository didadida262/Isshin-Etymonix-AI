const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// 处理主进程和渲染进程之间的通信
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// 性能优化：禁用不需要的功能
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
app.commandLine.appendSwitch('no-sandbox');

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // 性能优化
      imageAnimationRate: 60,
      webgl: true,
      spellcheck: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
    // 窗口配置
    show: false,
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'default',
    frame: true,
    // 性能优化选项
    paintWhenInitiallyHidden: true,
    skipTaskbar: false,
  });

  // 开发环境：加载 Vite 开发服务器
  // 生产环境：加载构建后的文件
  if (isDev) {
    const PORT = process.env.VITE_DEV_SERVER_PORT || 5173;
    mainWindow.loadURL(`http://localhost:${PORT}`);
    // 开发模式下不自动打开 DevTools，避免性能开销
    // 需要时可使用 Cmd+Option+I (macOS) 或 Ctrl+Shift+I (其他) 手动打开
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 性能优化：监听渲染进程性能
    mainWindow.webContents.on('did-finish-load', () => {
      // 页面加载完成后优化性能
      if (mainWindow) {
        // 启用视觉优化
        mainWindow.webContents.setBackgroundThrottling(false);
      }
    });
  });

  // 窗口关闭时
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // 性能监控（仅开发模式）
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // 可以添加性能监控逻辑
    });
  }
}

// 当 Electron 完成初始化时
app.whenReady().then(() => {
  // 禁用硬件加速如果遇到问题（默认启用）
  // app.disableHardwareAcceleration();
  
  createWindow();

  app.on('activate', () => {
    // macOS 上点击 dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 优化渲染性能
app.on('ready', () => {
  // 启用 GPU 加速
  if (mainWindow) {
    mainWindow.webContents.setFrameRate(60);
  }
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '应用',
      submenu: [
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: '韦林英文词根轰炸',
              message: '韦林英文词根轰炸 v0.1.0',
              detail: '一款高效学习英语词根的应用',
            });
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '开发者工具', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '文档',
          click: () => {
            const { shell } = require('electron');
            shell.openExternal('https://www.electronjs.org/docs');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 创建菜单
createMenu();

// 窗口控制事件处理
ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) mainWindow.maximize();
});

ipcMain.on('window-toggle-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});
