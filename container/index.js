require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');
const sha256 = require('js-sha256').sha256;
const { XOR } = require('../util');
const JSZip = require('jszip');
const { basename } = require('path');

const app = express();
app.use(require('body-parser').urlencoded({ extended: false, limit: '696969tb' }));

app.get('/', (req, res) => {
    res.send(fs.readFileSync('./public/index.html', 'utf-8'));
});

app.get('/dashboard', (req, res) => {
    res
    .status(403)
    .send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
});

app.post('/dashboard', (req, res) => {
    //res.json(req.body);
    //console.log(req.body);
    // console.log([process.env.USERNAME, process.env.PASSWORD]);
    // console.log([sha256(req.body.username), sha256(req.body.password)]);

    if ((process.env.USERNAME == sha256(req.body.username)) && (process.env.PASSWORD == sha256(req.body.password))) {
        res.send(fs.readFileSync('./public/dashboard.html', 'utf-8'));
    } else {
        res.send('incorrect details');
    }
});

app.get('/dashboard/files', (req, res) => {
    toSend = fs.readFileSync('./public/dashboard/files.html', 'utf-8');
    toSend += '<span>';

    let directories = "";
    let files = "";

    fs.readdirSync('./private/').forEach(file => {
        try {
            fs.readdirSync(`./private/${file}`);
            directories += `<input type="checkbox" onclick="return false;" readonly="readonly" disabled="disabled" id="${file}"><label for="${file}"> ${file}</label><br>` 
        } catch(e) {
            files += `<input type="checkbox" name="${file}" id="${file}"><label for="${file}"> ${file}</label><br>` 
            //toSend += file + '<br>';
        }

        
    });

    toSend += directories;
    toSend += files;
    toSend += '</span></form></body></html>'
    res.send(toSend);
});

app.post('/download', async (req, res) => {
    const zip = new JSZip();
    for (const path of Object.entries(req.body)) {
        if (path[0] == "encryption_key") continue;
        zip.file(basename(path[0]), fs.readFileSync(`./private/${path[0]}`));
    }
    res.setHeader('content-disposition', 'attachment; filename=files.zip');
    res.setHeader('content-type', 'application/zip');
    res.send(await zip.generateAsync({ type: 'nodebuffer' }));
});

app.post('/upload', (req, res) => {
    //console.log(req.body);
    let test = {}
    Object.entries(req.body).forEach(f => {
        test[f[0]] = f[1];
        //console.log(f, f[1]);
        fs.writeFileSync(`./private/${f[0]}`, Buffer.from(f[1].split(',').slice(1).join(','), 'base64'));
        //fs.writeFileSync(`./private/${f[0]}`, f[1].split(',').slice(1).join(','));
    });

    //console.log(test);

    for (const file in Object.entries(req.body)) {

    }
    res.send('ratio');
});

app.get('/dashboard/upload', (req, res) => {
    res.send(fs.readFileSync('./public/dashboard/upload.html', 'utf-8'));
});

app.post('/postAny', (req, res) => {
    console.log(req.body);
});

app.get('/Poppins-Light.ttf', (req, res) => {
    res.send(fs.readFileSync('./public/Poppins-Light.ttf', 'utf-8'));
});

app.get('*', (req, res) => {
    res
    .status(404)
    .send('<center><h1>404 Not Found</h1><hr><p>vapour-server</p></center>');
})

app.listen(process.env.PORT, () => {console.log(`Online at ${process.env.PORT}`)});