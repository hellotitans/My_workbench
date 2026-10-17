const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css  = read('.workbuddy/_css-extract.txt');
const body = read('prototype/src-body.html');
const app  = read('prototype/src-app.js');

const out = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>我的生活台 · V1.3 布局原型</title>',
  '<style>',
  css,
  '</style>',
  '</head>',
  '<body>',
  '<div id="app">',
  body,
  '</div>',
  '<script>',
  app,
  '</script>',
  '</body>',
  '</html>',
  ''
].join('\n');

const target = path.join(ROOT, 'prototype/v13-preview.html');
fs.writeFileSync(target, out, 'utf8');
console.log('生成:', target);
console.log('体积:', (fs.statSync(target).size / 1024).toFixed(1) + 'KB');
