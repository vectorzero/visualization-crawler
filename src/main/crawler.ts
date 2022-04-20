import path from 'path';
import { ipcMain } from 'electron';
import dayjs from 'dayjs';
import axios from 'axios';
import fs from 'fs';
import { getRandom, handleFileName } from './util';

const puppeteer = require('puppeteer-core');
const findChrome = require('./find_chrome');

const crawler = () => {
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
            date: dayjs().format('HH:mm:ss'),
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
        date: dayjs().format('HH:mm:ss'),
      });
      return;
    }
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
      ignoreDefaultArgs: ['--enable-automation'],
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
          event.reply('crawler', {
            type: 'error',
            msg: `【错误】${e.message}`,
            id: randomStr,
            date: dayjs().format('HH:mm:ss'),
          });
        }
      }
    }

    const autoScroll = (_page: any) => {
      return _page.evaluate(() => {
        return new Promise<void>((resolve) => {
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

    const downloadImage = async (url: string, dir: string, name: string) => {
      axios({
        method: 'get',
        url,
        responseType: 'stream',
      })
        .then((response: any) => {
          const fileString = path.basename(url);
          const fullName = `${dir ? `${dir}/` : ''}${getRandom(16)}-${
            fileString.split('.')[0]
          }`;
          const fileName = name ? `${dir ? `${dir}/` : ''}${name}` : fullName;
          const types = ['png', 'jpg', 'jpeg'];
          let fileType = 'png';
          types.forEach((item: string) => {
            if (fileString.split('.')[1].includes(item)) {
              fileType = item;
            }
          });
          response.data.pipe(fs.createWriteStream(`${fileName}.${fileType}`));
          return true;
        })
        .catch((err: string) => {
          console.log('image', err);
        });
    };

    const base64ToImg = async (src: string, dir: string, name: string) => {
      const reg = /^data:image\/(.*?);base64,(.*)/;
      const result = src.match(reg);
      const fullName = `${dir ? `${dir}/` : ''}${getRandom(16)}`;
      const fileName = name ? `${dir ? `${dir}/` : ''}${name}` : fullName;
      const fileType = result[1];
      const data = Buffer.from(result[2], 'base64');
      fs.writeFileSync(`${fileName}.${fileType}`, data);
    };

    async function getImg(src: string, dir: string, name: string) {
      if (/^http:\/\/|https:\/\//.test(src)) {
        await downloadImage(src, dir, name);
      } else {
        await base64ToImg(src, dir, name);
      }
    }

    asyncForEach(lastArr, async (item: any) => {
      const randomStr = getRandom(16);
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
            date: dayjs().format('HH:mm:ss'),
          });
        }
        if (item.type === 'click') {
          event.reply('crawler', {
            type: 'info',
            msg: `【单击】${item.target}`,
            id: randomStr,
            date: dayjs().format('HH:mm:ss'),
          });
          await ele.click();
        }
        if (item.type === 'dblclick') {
          event.reply('crawler', {
            type: 'info',
            msg: `【双击】${item.target}`,
            id: randomStr,
            date: dayjs().format('HH:mm:ss'),
          });
          await ele.click({ clickCount: 2 });
        }
        if (item.type === 'input') {
          const typeValue = item.value1 === 'text' ? item.value : '***********';
          event.reply('crawler', {
            type: 'info',
            msg: `【输入】${item.target} -> ${typeValue}`,
            id: randomStr,
            date: dayjs().format('HH:mm:ss'),
          });
          await ele.type(item.value);
        }
        if (item.type === 'text') {
          event.reply('crawler', {
            type: 'info',
            msg: `【爬取文本】正在爬取文本...`,
            id: randomStr,
            date: dayjs().format('HH:mm:ss'),
          });
          const texts = await page.evaluate((x: object) => {
            const arr: string[] = [];
            const doms = document.querySelectorAll(x.target);
            [...doms].forEach((v: any) => {
              arr.push(v.innerText);
            });
            return arr;
          }, item);
          if (texts.length) {
            const fileName = `${item.value ? `${item.value}/` : ''}${
              item.value2 ? item.value2 : getRandom(16)
            }`;
            const fileType = 'txt';
            fs.writeFileSync(`${fileName}.${fileType}`, texts.join('\n'));
            event.reply('crawler', {
              type: 'info',
              msg: `【爬取文本】文本保存至 ${item.value} 文件夹中`,
              id: randomStr + 1,
              date: dayjs().format('MM-DD HH:mm:ss'),
            });
          }
        }
        if (item.type === 'image') {
          event.reply('crawler', {
            type: 'info',
            msg: `【爬取图片】正在爬取图片...`,
            id: randomStr,
            date: dayjs().format('HH:mm:ss'),
          });
          const urls = await page.evaluate((x: object) => {
            const arr: object[] = [];
            let textDoms: string[] = [];
            const urlDoms = [...document.querySelectorAll(x.target)];
            if (x.value2) {
              textDoms = [...document.querySelectorAll(x.value2)];
            }
            urlDoms.forEach((v: any, index: number) => {
              arr.push({
                src: v.src,
                name: textDoms[index] ? textDoms[index].innerText : '',
              });
            });
            return arr;
          }, item);
          urls.forEach(async (obj: { src: string; name: string }) => {
            await getImg(obj.src, item.value, handleFileName(obj.name));
          });
          event.reply('crawler', {
            type: 'info',
            msg: `【爬取图片】图片保存至 ${item.value} 文件夹中`,
            id: randomStr + 1,
            date: dayjs().format('MM-DD HH:mm:ss'),
          });
        }
      }
      if (item.type === 'keyboard' && item.target) {
        event.reply('crawler', {
          type: 'info',
          msg: `【按键】${item.target}${item.value}`,
          id: randomStr,
          date: dayjs().format('HH:mm:ss'),
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
            date: dayjs().format('HH:mm:ss'),
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
          date: dayjs().format('HH:mm:ss'),
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
            await page.evaluate((x: string) => {
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
          date: dayjs().format('HH:mm:ss'),
        });
        await page.goto(item.target, { waitUntil: 'networkidle2' });
      }
      if (item.type === 'js' && item.value) {
        const jsCode = item.value;
        event.reply('crawler', {
          type: 'info',
          msg: `【运行js】${jsCode}`,
          id: randomStr,
          date: dayjs().format('HH:mm:ss'),
        });
        await page.evaluate((x: string) => {
          // eslint-disable-next-line no-eval
          eval(x);
        }, jsCode);
      }
      if (item.type === 'point') {
        const jsCode =
          // eslint-disable-next-line no-template-curly-in-string
          'window.addEventListener("click",function(e){alert(`${e.clientX},${e.clientY}`)})';
        event.reply('crawler', {
          type: 'info',
          msg: `【坐标获取】`,
          id: randomStr,
          date: dayjs().format('HH:mm:ss'),
        });
        await page.evaluate((x: string) => {
          // eslint-disable-next-line no-eval
          eval(x);
        }, jsCode);
      }
      if (item.type === 'screenshot') {
        const filePath = `${
          item.target ? `${item.target}/` : ''
        }${randomStr}.png`;
        event.reply('crawler', {
          type: 'info',
          msg: `【截图】${filePath}`,
          id: randomStr,
          date: dayjs().format('HH:mm:ss'),
        });
        await autoScroll(page);
        await page.screenshot({
          path: filePath,
          fullPage: true,
        });
      }
      if (item.type === 'wait' && item.value) {
        event.reply('crawler', {
          type: 'info',
          msg: `【等待】${item.value}ms`,
          id: randomStr,
          date: dayjs().format('HH:mm:ss'),
        });
        await page.waitForTimeout(item.value);
      }
      if (item.type === 'reload') {
        event.reply('crawler', {
          type: 'info',
          msg: `【刷新页面】`,
          id: randomStr,
          date: dayjs().format('HH:mm:ss'),
        });
        await page.reload();
      }
    });
    // await browser.close();
  });
};

export default crawler;
