/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

export const getRandom = (num: number) => {
  return Math.floor(
    (Math.random() + Math.floor(Math.random() * 9 + 1)) * 10 ** (num - 1)
  );
};

// 去除文件名中不合法的部分
export const handleFileName = (path: string) => {
  if (!path) return '';
  let buffer = '';
  for (let i = 0; i < path.length; i++) {
    if (
      path.charAt(i) == '\\' ||
      path.charAt(i) == '/' ||
      path.charAt(i) == ':' ||
      path.charAt(i) == '*' ||
      path.charAt(i) == '?' ||
      path.charAt(i) == '"' ||
      path.charAt(i) == '<' ||
      path.charAt(i) == '>' ||
      path.charAt(i) == '|'
    ) {
    } else {
      buffer += path.charAt(i);
    }
  }
  return buffer;
};
