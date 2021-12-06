import express from 'express';
import fs from 'fs';
let app = express();

let index = fs.readFileSync(require('path').join(process.cwd(), 'index.html'), 'utf-8');
let style = fs.readFileSync(require('path').join(process.cwd(), 'style.css'), 'utf-8');
let font = fs.readFileSync(require('path').join(process.cwd(), 'Poppins-Light.ttf'), 'utf-8');

app.get('/', (req, res) => {
    res.send(index);
});

app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css')
    res.send(style);
});

app.get('/Poppins-Light.ttf', (req, res) => {
    res.setHeader('Content-Type', 'font/ttf')
    res.send(font);
});

app.listen(2020);