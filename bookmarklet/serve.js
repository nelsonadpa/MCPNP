#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 7788;
const file = path.join(__dirname, 'er-filler.built.js');
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/javascript');
  res.end(fs.readFileSync(file, 'utf8'));
}).listen(PORT, () => console.log('eR Filler server on http://localhost:' + PORT));
