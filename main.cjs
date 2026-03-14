const { app, BrowserWindow, Menu, protocol, dialog } = require('electron');
const path = require('path');
const serve = require('electron-serve');

// 1. Register zentra:// as a secure and privileged scheme BEFORE app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'zentra', privileges: { standard: true, secure: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true } }
]);

const loadURL = (serve.default || serve)({
    directory: path.join(__dirname, 'dist'),
    scheme: 'zentra'
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: "Zentra Desktop",
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0c1222', // Match dark theme to avoid white flash
        show: false, // Don't show until ready-to-show
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            webviewTag: false, // Prevents embedding untrusted external content
            navigateOnDragDrop: false, // Prevents dropping of files to navigate
            devTools: !app.isPackaged // Disable dev tools in production
        }
    });

    // --- Hardening Security (CSP) ---
    const { session } = mainWindow.webContents;
    session.webRequest.onHeadersReceived((details, callback) => {
        // Force strict CSP header on all responses in the renderer
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: https:; " +
                    "connect-src 'self' wss: https: http://127.0.0.1:* http://localhost:*; " +
                    "object-src 'none'; " +
                    "base-uri 'none'; " +
                    "form-action 'self';"
                ]
            }
        });
    });

    // --- Hardening Security & Navigation ---
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        // Allow our internal custom protocol and standard web links
        if (parsedUrl.protocol !== 'zentra:' && parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            event.preventDefault();
        }
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message} (Line ${line})`);
    });

    // Native Diagnostics: If the page fails to load, tell the user instead of white screen
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load: ${validatedURL} [${errorCode}: ${errorDescription}]`);
        if (!app.isPackaged) return; // Don't show in dev as much

        dialog.showErrorBox(
            'Error de Carga de Interfaz',
            `Zentra no pudo cargar los archivos del sistema.\n\nDetalle: ${errorDescription}\nURL: ${validatedURL}\n\nPor favor, contacta con soporte si este error persiste.`
        );
    });

    // Prevent any new windows or popup mechanisms completely
    mainWindow.webContents.setWindowOpenHandler(() => {
        console.warn('Blocked attempt to open new window');
        return { action: 'deny' };
    });

    const isDev = !app.isPackaged;

    if (isDev) {
        // In local development we still load via file:// for ease of HMR debugging sometimes, 
        // but here we force index.html from dist to test the exact production logic
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
        mainWindow.webContents.openDevTools();
    } else {
        loadURL(mainWindow);
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    Menu.setApplicationMenu(null);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
