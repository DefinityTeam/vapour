import express from 'express';
let app = express();

app.get('/', (req, res) => {
    res.sendFile(require('path').join(process.cwd(), 'index.html'))
});

app.get('/style.css', (req, res) => {
    res.sendFile(require('path').join(process.cwd(), 'style.css'))
});

app.get('/Poppins-Light.ttf', (req, res) => {
    res.sendFile(require('path').join(process.cwd(), 'Poppins-Light.ttf'))
});

app.listen(2020);