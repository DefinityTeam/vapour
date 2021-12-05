// todo list:
// - [x] JavaScript to TypeScript
// - [-] sync to async
// - [x] clean up duplicated code
// - [ ] Google Fonts -> local fonts
// - [x] get rid of useless shit (unused commented code) -roux
// - [x] MAKE SURE THERE IS A COMPILED JS FILE THE LAUNCHER CAN RUN IN THE GITHUB REPO WHEN YOU PUSH -roux

require('dotenv').config();
const express = require('express');
import { Request, Response, NextFunction } from 'express';
import * as fs from 'node:fs';
import { sha256 } from 'js-sha256';
const JSZip = require('jszip');
import { basename } from 'node:path';
const app = express();
const fileUpload = require('express-fileupload')

let ipArray;
let toSend;
let envFile;

app.use(express.urlencoded({ extended: false, limit: "922337203685477580711000000000kb" }));
app.use(fileUpload({ debug: false }));

function checkIP(intake: String) {
    ipArray = JSON.parse(process.env['IPLIST'] as string);
    switch (process.env['IPTYPE']) {
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

async function xForwardedFor (req: Request, res: Response, next: NextFunction) {
    if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress as string)) return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    next();
}
app.get('*', xForwardedFor);
app.post('*', xForwardedFor);

app.get('/', (req: Request, res: Response) => { 
    fs.readFile('./public/index.html', 'utf-8', (err, data) => { 
        res.send(data); 
    });
});

app.get('/dashboard', (req: Request, res: Response) => { res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>'); });

app.post('/dashboard', (req: Request, res: Response) => {
    if ((process.env['LOGIN'] == sha256(req.body.username)) && (process.env['PASSWORD'] == sha256(req.body.password))) {
        res.send(fs.readFileSync('./public/dashboard.html', 'utf-8'));
        fs.appendFileSync('./private/accesslogs.txt', `successful dashboard access at ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`)
    } else {
        res.send('incorrect details');
        fs.appendFileSync('./private/accesslogs.txt', `failed dashboard access at ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`)
    }
});

app.get('/dashboard/*', (req: Request, res: Response) => { return res.status(405).send('<center><h1>405 Method Not Allowed</h1><hr><p>vapour-server</p></center>'); });

app.post('/dashboard/:page', (req: Request, res: Response) => {
    if (!(req.body['username'] && req.body['password'] && req.body['username'].length > 2 && req.body['password'].length > 2 && sha256(req.body['username']) == process.env['LOGIN'] && sha256(req.body['password']) == process.env['PASSWORD'])) { 
        return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    }

    switch (req.params['page']) {
        case 'files':
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
                }
            });
        
            toSend += directories;
            toSend += files;
            toSend += '</span></form></body></html>'
            res.send(toSend);
            break;
        case 'serviceconfig': 
            fs.readFile(`./private/accesslogs.txt`, 'utf8', (logErr, logData) => { 
                if (logErr) { res.status(500).send('<center><h1>500 Internal Server Error</h1><hr><p>vapour-server</p></center>'); };
                fs.readFile(`./public/dashboard/serviceconfig.html`, 'utf8', (pageErr, pageData) => {
                    if (pageErr) { res.status(500).send('<center><h1>500 Internal Server Error</h1><hr><p>vapour-server</p></center>'); }; 
                    res.send(`${pageData}<script>document.getElementById('logs').value = \`${logData}\`</script>`); 
                });
            });
            break;
        default:
            fs.access(`./public/dashboard/${req.params['page']}.html`, fs.constants.R_OK, (err) => {
                if (err) { res.status(404).send('<center><h1>404 Not Found</h1><hr><p>vapour-server</p></center>'); };
                fs.readFile(`./public/dashboard/${req.params['page']}.html`, 'utf8', (err, data) => { res.send(data); });
            });
        
    }
})


app.post('/download', async (req: Request, res: Response) => {
    const zip = new JSZip();
    for (const path of Object.entries(req.body)) {
        if (path[0] == "encryption_key") continue; // REMOVE THIS PARAMETER ON CLIENT END IF USED. DO NOT DO THIS SERVER SIDE. WE WILL PROVIDE A DECRYPTION TOOL.
        zip.file(basename(path[0]), fs.readFileSync(`./private/${path[0]}`));
    }
    res.setHeader('content-disposition', 'attachment; filename=files.zip');
    res.setHeader('content-type', 'application/zip');
    res.send(await zip.generateAsync({ type: 'nodebuffer' }));
});

app.post('/upload', (req: Request, res: Response) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    console.log(req.files.f);

    (Array.isArray(req.files.f) ? req.files.f : [req.files.f]).forEach(file => {
        file.mv('./private/' + file.name, (err) => {
            if (err) return res.status(500).send(err);
            
        });
    });

    res.send('ok'); // make this redirect back to dash at some point (roux do this not jb)
});

app.post('/api/file/:file', (req: Request, res: Response) => {
    try {
        res.status(200).sendFile(require('path').join(process.cwd(), 'private/' + req.params.file));
    } catch(e) {
        res.status(500).send('file not found')
    }
});

app.post('/options', (req: Request, res: Response) => {
    if (!Object.entries(req.body).length) return res
    .status(400)
    .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');

    envFile = fs.readFileSync('.env', 'utf8').split('\n');
    if (req.body['ipType']) {
        switch (req.body['ipType']) {
            case 'allowAll':
                process.env['IPTYPE'] = 'ALLOWALL';
                envFile[3] = 'IPTYPE=ALLOWALL';
            break;
            case 'blockSpecific':
                if (!req.body['ipList']) { 
                    return res
                    .status(400)
                    .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>'); 
                }
                process.env['IPTYPE'] = 'BLOCKSPECIFIC';
                process.env['IPLIST'] = JSON.stringify(req.body['ipList'].split(' '));
                envFile[3] = 'IPTYPE=BLOCKSPECIFIC';
                envFile[4] = 'IPLIST=' + JSON.stringify(req.body['ipList'].split(' '));
                
            break;
            case 'blockAll':
                if (!req.body['ipList']) {
                    return res
                    .status(400)
                    .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');
                }
                process.env['IPTYPE'] = 'BLOCKALL';
                process.env['IPLIST'] = JSON.stringify(req.body['ipList'].split(' '));
                envFile[3] = 'IPTYPE=BLOCKALL';
                envFile[4] = 'IPLIST=' + JSON.stringify(req.body['ipList'].split(' '));
            break;
            default:
                null;
        }
    }

    if (req.body['oldPassword'] && req.body['newPassword']) {
        if (sha256(req.body['oldPassword']) == process.env['PASSWORD']) {
            process.env['PASSWORD'] = sha256(req.body['newPassword']);
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

app.post('/postAny', (req: Request, res: Response) => {
    console.log(req.body);
});

app.get('*', (req: Request, res: Response) => {
    res
    .status(404)
    .send('<center><h1>404 Not Found</h1><hr><p>vapour-server</p></center>');
});

app.listen(process.env['PORT'], () => {console.log(`Online at ${process.env['PORT']}`)});