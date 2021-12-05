require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');
const sha256 = require('js-sha256').sha256;
const { XOR } = require('../util');
const JSZip = require('jszip');
const { basename } = require('path');
const app = express();

const fileUpload = require('express-fileupload')

app.use(require('body-parser').urlencoded({ extended: false, limit: '696969tb' }));
app.use(fileUpload({
    debug: true
}));

function checkIP(intake) {
    //console.log(process.env.IPLIST)
    ipArray = JSON.parse(process.env.IPLIST);
    switch (process.env.IPTYPE) {
        case 'BLOCKSPECIFIC':
            if (ipArray.includes(intake)) return true;
        break; 

        case 'BLOCKALL':
            if (!ipArray.includes(intake)) return true;
        break; 

        default:
            return false;
    }
} 

app.get('/', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    //console.log(req.header('x-forwarded-for') || req.connection.remoteAddress);
    res.send(fs.readFileSync('./public/index.html', 'utf-8'));
});

app.get('/dashboard', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    res
    .status(403)
    .send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
});

app.post('/dashboard', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    //res.json(req.body);
    //console.log(req.body);
    // console.log([process.env.LOGIN, process.env.PASSWORD]);
    // console.log([sha256(req.body.username), sha256(req.body.password)]);

    //console.log( process.env.LOGIN, sha256(req.body.username), process.env.PASSWORD, sha256(req.body.password) )

    if ((process.env.LOGIN == sha256(req.body.username)) && (process.env.PASSWORD == sha256(req.body.password))) {
        res.send(fs.readFileSync('./public/dashboard.html', 'utf-8'));
        fs.appendFileSync('./private/accesslogs.txt', `successful dashboard access at ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`)
    } else {
        res.send('incorrect details');
        fs.appendFileSync('./private/accesslogs.txt', `failed dashboard access at ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`)
    }
});

app.get('/dashboard/*', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    return res
    .status(405)
    .send('<center><h1>405 Method Not Allowed</h1><hr><p>vapour-server</p></center>');
    
});

app.post('/dashboard/files', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    if (!(req.body.username && req.body.password && req.body.username.length > 2 && req.body.password.length > 2 && sha256(req.body.username) == process.env.LOGIN && sha256(req.body.password) == process.env.PASSWORD)) {
        return res
        .status(403)
        .send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    }

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
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
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
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    //console.log(req.body);
    // let test = {}
    // Object.entries(req.body).forEach(f => {
    //     test[f[0]] = f[1];
    //     //console.log(f, f[1]);
    //     fs.writeFileSync(`./private/${f[0]}`, Buffer.from(f[1].split(',').slice(1).join(','), 'base64'));
    //     //fs.writeFileSync(`./private/${f[0]}`, f[1].split(',').slice(1).join(','));
    // });

    // //console.log(test);

    // for (const file in Object.entries(req.body)) {

    // }


    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // console.log(req.files);
    console.log(req.files.f);

    
    (Array.isArray(req.files.f) ? req.files.f : [req.files.f]).forEach(file => {
        //console.log(file);
        file.mv('./private/' + file.name, (err) => {
            if (err) return res.status(500).send(err);
            
        });
    });

    res.send('ok');
});

app.post('/dashboard/upload', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    if (!(req.body.username && req.body.password && req.body.username.length > 2 && req.body.password.length > 2 && sha256(req.body.username) == process.env.LOGIN && sha256(req.body.password) == process.env.PASSWORD)) {
        return res
        .status(403)
        .send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    }
    
    res.send(fs.readFileSync('./public/dashboard/upload.html', 'utf-8'));
    
});

app.post('/dashboard/options', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    if (!(req.body.username && req.body.password && req.body.username.length > 2 && req.body.password.length > 2 && sha256(req.body.username) == process.env.LOGIN && sha256(req.body.password) == process.env.PASSWORD)) {
        return res
        .status(403)
        .send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    }

    res.send(fs.readFileSync('./public/dashboard/options.html', 'utf-8'));
});

app.post('/options', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    if (!Object.entries(req.body).length) return res
    .status(400)
    .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');

    envFile = fs.readFileSync('.env', 'utf8').split('\n');

    if (req.body['ipType']) {
        switch (req.body['ipType']) {
            case 'allowAll':
                process.env.IPTYPE = 'ALLOWALL';
                envFile[3] = 'IPTYPE=ALLOWALL';
            break;
            case 'blockSpecific':
                if (!req.body['ipList']) {
                    return res
                    .status(400)
                    .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');
                }
                process.env.IPTYPE = 'BLOCKSPECIFIC';
                process.env.IPLIST = JSON.stringify(req.body['ipList'].split(' '));
                envFile[3] = 'IPTYPE=BLOCKSPECIFIC';
                envFile[4] = 'IPLIST=' + JSON.stringify(req.body['ipList'].split(' '));
                
            break;
            case 'blockAll':
                if (!req.body['ipList']) {
                    return res
                    .status(400)
                    .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');
                }
                process.env.IPTYPE = 'BLOCKALL';
                process.env.IPLIST = JSON.stringify(req.body['ipList'].split(' '));
                envFile[3] = 'IPTYPE=BLOCKALL';

                //let newIpList = req.body['ipList'].split(' ').s(x => x = '\"' + x + '\"');
                //console.log(newIpList);

                envFile[4] = 'IPLIST=' + JSON.stringify(req.body['ipList'].split(' '));
            break;
            default:
                null;
        }
    }

    if (req.body['oldPassword'] && req.body['newPassword']) {
        if (sha256(req.body['oldPassword']) == process.env.PASSWORD) {
            process.env.PASSWORD = sha256(req.body['newPassword']);
            envFile[2] = 'PASSWORD=' + sha256(req.body['newPassword']);
        } else {
            return res
            .status(400)
            .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');
        }
    }

    fs.writeFileSync('.env', envFile.join('\n'));
    try {
        res.send('success');
    } catch(e) {
        return;
    }
});

app.post('/dashboard/serviceconfig', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    if (!(req.body.username && req.body.password && req.body.username.length > 2 && req.body.password.length > 2 && sha256(req.body.username) == process.env.LOGIN && sha256(req.body.password) == process.env.PASSWORD)) {
        return res
        .status(403)
        .send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    }

    fs.readFileSync('./private/accesslogs.txt', 'utf-8')
    res.send(fs.readFileSync('./public/dashboard/serviceconfig.html', 'utf-8') + `<script>document.getElementById('logs').value = \`${fs.readFileSync('./private/accesslogs.txt', 'utf-8')}\`</script>`);
});

app.post('/postAny', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    console.log(req.body);
});

app.get('/Poppins-Light.ttf', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    res.send(fs.readFileSync('./public/Poppins-Light.ttf', 'utf-8'));
});

app.get('*', (req, res) => {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    res
    .status(404)
    .send('<center><h1>404 Not Found</h1><hr><p>vapour-server</p></center>');
});

app.listen(process.env.PORT, () => {console.log(`Online at ${process.env.PORT}`)});