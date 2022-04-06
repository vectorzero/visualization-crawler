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
import axios from 'axios';
import fs from 'fs';
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
  // 外循环
  let lastArr: object[] = [];
  if (arg && arg.list && arg.list.length && arg.times) {
    let tempList = arg.list;
    const startList = tempList.filter(
      (v: { type: string }) => v.type === 'sLoop'
    );
    const endList = tempList.filter(
      (v: { type: string }) => v.type === 'eLoop'
    );
    if (startList.length || endList.length) {
      if (startList.length === 1 && endList.length === 1) {
        // 内循环
        const startIndex = tempList.findIndex(
          (v: { type: string }) => v.type === 'sLoop'
        );
        const endIndex = tempList.findIndex(
          (v: { type: string }) => v.type === 'eLoop'
        );
        const startArr = tempList.slice(0, startIndex);
        const endArr = tempList.slice(endIndex + 1, tempList.length);
        const loopTimes = +tempList.find(
          (v: { type: string }) => v.type === 'sLoop'
        ).value;
        const loopArr = tempList.slice(startIndex + 1, endIndex);
        const midArr = new Array(loopTimes).fill(loopArr).flat();
        tempList = [...startArr, ...midArr, ...endArr];
      } else {
        event.reply('crawler', {
          type: 'error',
          msg: `【错误】只允许存在一个开始循环和结束循环`,
          id: getRandom(16),
          date: dayjs().format('MM-DD HH:mm:ss'),
        });
        return;
      }
    }
    for (let i = 0; i < arg.times; i += 1) {
      lastArr = [...lastArr, ...tempList];
    }
  } else {
    event.reply('crawler', {
      type: 'error',
      msg: `【错误】步骤不能为空`,
      id: getRandom(16),
      date: dayjs().format('MM-DD HH:mm:ss'),
    });
    return;
  }
  // console.log(screen.getCursorScreenPoint());
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
  async function asyncForEach(
    array: string | any[],
    callback: {
      (item: any): Promise<void>;
      (arg0: any, arg1: number, arg2: any): any;
    }
  ) {
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < array.length; index++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await callback(array[index], index, array);
      } catch (e: any) {
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

  const autoScroll = (_page: any) => {
    return _page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const { scrollHeight } = document.body;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  };

  const downloadImage = async (url: string, dir: string) => {
    axios({
      method: 'get',
      url,
      responseType: 'stream',
    })
      .then((response: any) => {
        const fileString = path.basename(url);
        const fileName = fileString.split('.')[0] + getRandom(16);
        const fileType = fileString.split('.')[1];
        response.data.pipe(fs.createWriteStream(`${fileName}.${fileType}`));
      })
      .catch((err: any) => {
        console.log('image', err);
      });
  };

  const base64ToImg = async (src: string, dir: string) => {
    const reg = /^data:image\/(.*?);base64,(.*)/;
    const result = src.match(reg);
    const ext = result[1];
    const data = Buffer.from(result[2], 'base64');
    console.log('base64ToImg : ', src.slice(0, 50));
    // await writeFile(imgDir(ext), data);
  };

  async function getImg(src) {
    if (/^http:\/\/|https:\/\//.test(src)) {
      await downloadImage(src);
    } else {
      await base64ToImg(src);
    }
  }

  asyncForEach(lastArr, async (item: any) => {
    const randomStr = getRandom(16);
    const now = dayjs().format('MM-DD HH:mm:ss');
    if (
      item.type !== 'point' &&
      item.type !== 'jump' &&
      item.type !== 'js' &&
      item.type !== 'keyboard' &&
      item.type !== 'mouse' &&
      item.type !== 'screenshot' &&
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
      if (item.type === 'dblclick') {
        event.reply('crawler', {
          type: 'info',
          msg: `【双击】${item.target}`,
          id: randomStr,
          date: now,
        });
        await ele.click({ clickCount: 2 });
      }
      if (item.type === 'input') {
        const typeValue = item.value1 === 'text' ? item.value : '***********';
        event.reply('crawler', {
          type: 'info',
          msg: `【输入】${item.target} -> ${typeValue}`,
          id: randomStr,
          date: now,
        });
        await ele.type(item.value);
      }
      if (item.type === 'image') {
        const urls = await page.evaluate((x: any) => {
          const arr = [];
          const images = document.querySelectorAll(x.target);
          [...images].forEach((v: any) => {
            arr.push(v.src);
          });
          return arr;
        }, item);
        urls.forEach(async (src) => {
          await getImg(src);
        });
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
    if (item.type === 'mouse' && item.target) {
      if (!(item.value && item.value.includes(','))) {
        event.reply('crawler', {
          type: 'error',
          msg: `【错误】坐标值异常`,
          id: randomStr,
          date: now,
        });
        return;
      }
      const points = item.value.split(',');
      const pointX = +points[0];
      const pointY = +points[1];
      event.reply('crawler', {
        type: 'info',
        msg: `【鼠标】${item.target}${item.value}`,
        id: randomStr,
        date: now,
      });
      const keyMap = {
        持续按着: 'down',
        按一下: 'click',
        释放鼠标: 'up',
        移动鼠标: 'move',
      };
      if (item.target === '按一下' || item.target === '移动鼠标') {
        await page.mouse[keyMap[item.target]](pointX, pointY);
        const clickCode =
          // eslint-disable-next-line no-template-curly-in-string
          `const point = document.createElement('div');point.setAttribute( 'class', 'point${randomStr}');document.body.appendChild(point); const styleSheet = document.createElement('style'); document.head.appendChild(styleSheet); styleSheet.textContent = '.point${randomStr}{background:rgba(255,255,0,0.3); width:30px; height:30px;position:fixed; top:${
            pointY - 15
          }px; left:${
            pointX - 15
          }px; border-radius: 50%;z-index: 9999;} .point${randomStr}::after{content: "";background: red; width: 2px; height: 2px; position: fixed; top: ${pointY}px; left: ${pointX}px;}'`;
        if (item.target === '按一下') {
          await page.evaluate((x: any) => {
            // eslint-disable-next-line no-eval
            eval(x);
            // eslint-disable-next-line no-template-curly-in-string
          }, clickCode);
        }
      } else {
        await page.mouse[keyMap[item.target]]();
      }
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
      await page.evaluate((x: any) => {
        // eslint-disable-next-line no-eval
        eval(x);
      }, jsCode);
    }
    if (item.type === 'point') {
      event.reply('crawler', {
        type: 'info',
        msg: `【坐标获取】`,
        id: randomStr,
        date: now,
      });
      await page.evaluate((x: any) => {
        // eslint-disable-next-line no-eval
        eval(x);
        // eslint-disable-next-line no-template-curly-in-string
      }, 'window.addEventListener("click",function(e){alert(`${e.clientX},${e.clientY}`)})');
    }
    if (item.type === 'screenshot') {
      event.reply('crawler', {
        type: 'info',
        msg: `【截图】${randomStr}.png`,
        id: randomStr,
        date: now,
      });
      await autoScroll(page);
      await page.screenshot({
        path: `${item.target ? `${item.target}/` : ''}${randomStr}.png`,
        fullPage: true,
      });
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
  // await browser.close()
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
  mainWindow.webContents.setWindowOpenHandler((data) => {
    shell.openExternal(data.url);
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
