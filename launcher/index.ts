require('dotenv').config();

import { execSync, spawn } from 'child_process';
import express from 'express';
import fs from 'fs';
import sha256 from 'js-sha256';
import fetch from "node-fetch";

let app = express();
app.listen(8080);

app.use(require('body-parser').urlencoded({ extended: false, limit: '10mb' }));

app.get('/',  (req, res) => {
    res.send(`
        <form method="post" action="/createContainer">
        GB <input name="gb" type="text"> <br>
        Username <input name="username" type="text"> <br>
        Password <input name="password" type="text"> <br>
        Authentication A <input name="authentication_token_a" type="text"> <br>
        Authentication B <input name="authentication_token_b" type="text"> <br>
        Authentication C <input name="authentication_token_c" type="text"> <br>
        Submit <input type="submit"> <br>
        </form>
    `);
});

app.get('/getStats', (req, res) => {
    let size = spawn('sudo', ['du', '-sh', '/']);
    size.stdout.on('data', function (data) {
        console.log('size: ' + data);
        console.log([data.toString()]);
        //res.send('order complete: ' + data.toString().split('\t/')[0]);
        res.status(200);
        res.json( { usedStorage: parseInt(data.toString().split('\t/')[0]), cappedStorage: parseInt(process.env['AVAILABLE_STORAGE_IN_GIGABYTES']!) } );
    });
});

app.post('/createContainer', async (req, res) => {
    let authA = process.env.AUTH_A == req.body.authentication_token_a;
    let authB = process.env.AUTH_B == req.body.authentication_token_b;
    let authC = process.env.AUTH_C == req.body.authentication_token_c;
    let gb = parseInt(req.body.gb) > 1;
    let usernameExist = req.body.username.length > 2;
    let passwordExist = req.body.password.length > 2;
    let ok = authA && authB && authC && gb && usernameExist && passwordExist;
    console.log([authA, authB, authC, gb, usernameExist, passwordExist])

    console.log(process.env.AUTH_A, req.body.authentication_token_a)

    console.log(ok);

    if (ok) {
        let size = spawn('sudo', ['du', '-sh', '/home/me']);
        size.stdout.on('data', async function (data) {
            console.log('size: ' + data);
            console.log([data.toString()]);
            //res.send('order complete: ' + data.toString().split('\t/')[0]);
            res.status(200);
            

            let identifier = Math.floor(Math.random() * 1000);

            let done=false;

            while(!done) {
                try {
                    fs.readdirSync(`storage-container-${identifier}`);
                    identifier = Math.floor(Math.random() * 1000);
                } catch(e) {
                    // fs.writeFileSync('createContainer.sh', `mkdir storage-container-${identifier}\n`);
                    fs.writeFileSync('createContainer.sh', ``);
                    fs.mkdirSync(`storage-container-${identifier}`);

                    let port = 0;
                    console.log(port);
                    while (port < 1000) {
                        
                        let testPort = Math.floor(Math.random() * 65535);
                        //console.log(testPort);
                        try {
                            // (async() => {
                                await fetch('http://0.0.0.0:' + testPort, {})
                                .then(res => res.text())
                                .then(body => console.log(body));
                            // })();
                        } catch(e) {
                            console.log(e);
                            port = testPort;
                        }
                    }
                    fs.writeFileSync(`storage-container-${identifier}/.env`, `PORT=${port}\nLOGIN=${sha256.sha256(req.body.username)}\nPASSWORD=${sha256.sha256(req.body.password)}\nIPLIST=[]\nIPTYPE=ALLOWALL`);
                    fs.appendFileSync('createContainer.sh', `cd storage-container-${identifier}\n`);
                    fs.appendFileSync('createContainer.sh', `git clone https://github.com/DefinityTeam/vapour \n`);
                    fs.appendFileSync('createContainer.sh', `mv ./vapour/container/* . \n`);
                    fs.appendFileSync('createContainer.sh', `rm -rf vapour`)
                    fs.writeFileSync('startContainer.sh', `cd storage-container-${identifier}\n`);
                    fs.appendFileSync('startContainer.sh', `pm2 start index.js -n "storage-container-${identifier} @ ${port}"`);

                    console.log('create container');
                    execSync('bash ./createContainer.sh');
                    console.log('start container');
                    execSync('bash ./startContainer.sh');
                    console.log('ok');
                    done = true;  
                    res.json( { type: 'success', port: port, address: `services-fr-01.definityteam.com:${port}` } );
                }
            }
            console.log('finished action');                   
        });          
    }
});
