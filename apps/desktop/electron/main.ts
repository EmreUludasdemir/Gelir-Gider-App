import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  nativeImage,
  ipcMain,
  shell,
} from 'electron';
import * as path from 'path';

// Environment
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const WEB_URL = isDev ? 'http://localhost:3000' : 'file://' + path.join(__dirname, '../web/out/index.html');

// Global references
let mainWindow: BrowserWindow | null = null;
let quickAddWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

/**
 * Create main application window
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Gelir Gider',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  // Load the app
  mainWindow.loadURL(WEB_URL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * Create quick add transaction window
 */
function createQuickAddWindow(): void {
  if (quickAddWindow) {
    quickAddWindow.focus();
    return;
  }

  quickAddWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Hizli Islem Ekle',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  quickAddWindow.loadURL(WEB_URL + '/quick-add');

  quickAddWindow.on('blur', () => {
    quickAddWindow?.close();
  });

  quickAddWindow.on('closed', () => {
    quickAddWindow = null;
  });
}

/**
 * Create system tray icon and menu
 */
function createTray(): void {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  let icon: Electron.NativeImage;
  
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Gelir Gider');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ac',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Hizli Islem Ekle',
      accelerator: 'Ctrl+Shift+G',
      click: () => {
        createQuickAddWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Dashboard',
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(WEB_URL + '/dashboard');
      },
    },
    {
      label: 'Islemler',
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(WEB_URL + '/transactions');
      },
    },
    {
      label: 'Butceler',
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(WEB_URL + '/budgets');
      },
    },
    { type: 'separator' },
    {
      label: 'Cikis',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click to show window
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

/**
 * Register global shortcuts
 */
function registerShortcuts(): void {
  // Quick add shortcut: Ctrl+Shift+G
  globalShortcut.register('CommandOrControl+Shift+G', () => {
    createQuickAddWindow();
  });
}

/**
 * Unregister all shortcuts
 */
function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}

// ============================================
// IPC Handlers
// ============================================

ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:is-dev', () => {
  return isDev;
});

ipcMain.on('window:close-quick-add', () => {
  quickAddWindow?.close();
});

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

// ============================================
// App Lifecycle
// ============================================

// Extend app with isQuitting property
declare module 'electron' {
  interface App {
    isQuitting: boolean;
  }
}

app.isQuitting = false;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // App ready
  app.whenReady().then(() => {
    createMainWindow();
    createTray();
    registerShortcuts();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        mainWindow?.show();
      }
    });
  });
}

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, stay in tray
  }
});

// Before quit, cleanup
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Cleanup on quit
app.on('will-quit', () => {
  unregisterShortcuts();
  tray?.destroy();
});
