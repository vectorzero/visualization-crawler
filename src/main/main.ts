/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Menu, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import dayjs from 'dayjs';
// import MenuBuilder from './menu';
import { resolveHtmlPath, getRandom } from './util';

const puppeteer = require('puppeteer-core');
const findChrome = require('./find_chrome');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('crawler', async (event, arg) => {
  console.log(screen.getCursorScreenPoint());
  const findChromePath = await findChrome({});
  const { executablePath } = findChromePath;
  const launchConfig = {
    executablePath,
    headless: false,
    openInExistingWindow: true,
    defaultViewport: {
      width: 0,
      height: 0,
    },
    ignoreDefaultArgs: ['--enable-automation'], // 去掉左上角 Chrome 正受自动软件控制
    args: ['--start-maximized'],
  };
  const browser = await puppeteer.launch(launchConfig);
  // const browserWSEndpoint = browser.wsEndpoint();
  // browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();
  async function asyncForEach(array: string | any[], callback: { (item: any): Promise<void>; (arg0: any, arg1: number, arg2: any): any; }) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < array.length; index++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await callback(array[index], index, array);
      } catch (e:any) {
        const randomStr = getRandom(16);
        const now = dayjs().format('MM-DD HH:mm:ss');
        event.reply('crawler', {
          type: 'error',
          msg: `【错误】${e.message}`,
          id: randomStr,
          date: now,
        });
      }
    }
  }
  if (arg && arg.list && arg.list.length && arg.times) {
    let arr: object[] = []
    for(let i = 0; i < arg.times; i++) {
      arr = [...arr,...arg.list]
    }
    asyncForEach(arr, async (item:any) => {
      const randomStr = getRandom(16);
      const now = dayjs().format('MM-DD HH:mm:ss');
      if (
        item.type !== 'jump' &&
        item.type !== 'js' &&
        item.type !== 'keyboard' &&
        item.target
      ) {
        await page.waitForSelector(item.target);
        const ele = await page.$(item.target);
        if (item.type === 'exist') {
          event.reply('crawler', {
            type: 'info',
            msg: `【存在】${item.target}`,
            id: randomStr,
            date: now,
          });
        }
        if (item.type === 'click') {
          event.reply('crawler', {
            type: 'info',
            msg: `【单击】${item.target}`,
            id: randomStr,
            date: now,
          });
          await ele.click();
        }
        if (item.type === 'dbclick') {
          event.reply('crawler', {
            type: 'info',
            msg: `【双击】${item.target}`,
            id: randomStr,
            date: now,
          });
          await ele.click({ clickCount: 2 });
        }
        if (item.type === 'input') {
          event.reply('crawler', {
            type: 'info',
            msg: `【输入】${item.target} -> ${item.value}`,
            id: randomStr,
            date: now,
          });
          await ele.type(item.value);
        }
      }
      if (item.type === 'keyboard' && item.target) {
        event.reply('crawler', {
          type: 'info',
          msg: `【按键】${item.target}${item.value}`,
          id: randomStr,
          date: now,
        });
        const keyMap = {
          持续按着: 'down',
          按一下: 'press',
          释放按键: 'up',
        };
        await page.keyboard[keyMap[item.target]](item.value);
      }
      if (item.type === 'jump' && item.target) {
        event.reply('crawler', {
          type: 'info',
          msg: `【跳转】${item.target}`,
          id: randomStr,
          date: now,
        });
        await page.goto(item.target, { waitUntil: 'networkidle2' });
      }
      if (item.type === 'js' && item.value) {
        const jsCode = item.value;
        event.reply('crawler', {
          type: 'info',
          msg: `【运行js】${jsCode}`,
          id: randomStr,
          date: now,
        });
        await page.evaluate((x:any) => {
          // eslint-disable-next-line no-eval
          eval(x);
        }, jsCode);
      }
      if (item.type === 'wait' && item.value) {
        event.reply('crawler', {
          type: 'info',
          msg: `【等待】${item.value}ms`,
          id: randomStr,
          date: now,
        });
        await page.waitForTimeout(item.value);
      }
      if (item.type === 'reload') {
        event.reply('crawler', {
          type: 'info',
          msg: `【刷新页面】`,
          id: randomStr,
          date: now,
        });
        await page.reload();
      }
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  Menu.setApplicationMenu(null);
  if (isDevelopment) {
    // await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 700,
    height: 700,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
