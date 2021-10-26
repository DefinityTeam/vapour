const child_process = require('child_process');
const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();
//import fetch from "node-fetch";

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
    let size = child_process.spawn('sudo', ['du', '-sh', '/']);
    size.stdout.on('data', function (data) {
        console.log('size: ' + data);
        console.log([data.toString()]);
        //res.send('order complete: ' + data.toString().split('\t/')[0]);
        res.status(200);
        res.json( { usedStorage: parseInt(data.toString().split('\t/')[0]), cappedStorage: parseInt(process.env.AVAILABLE_STORAGE_IN_GIGABYTES) } );
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

    console.log(ok);

    if (ok) {
        let size = child_process.spawn('sudo', ['du', '-sh', '/']);
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
                                await fetch('http://0.0.0.0:' + testPort)
                                .then(res => res.text())
                                .then(body => console.log(body));
                            // })();
                        } catch(e) {
                            console.log(e);
                            port = testPort;
                        }
                    }


                    

                    fs.writeFileSync(`storage-container-${identifier}/.env`, `PORT=${port}\nUSERNAME=8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4\nPASSWORD=8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4`);

                    fs.appendFileSync('createContainer.sh', `cd storage-container-${identifier}\n`);
                    fs.appendFileSync('createContainer.sh', `git clone https://github.com/DefinityTeam/vapour \n`);
                    fs.appendFileSync('createContainer.sh', `mv ./vapour/container/* . \n`);
                    fs.appendFileSync('createContainer.sh', `rm -rf vapour`)
                    
                    fs.writeFileSync('startContainer.sh', `cd storage-container-${identifier}\n`);
                    fs.appendFileSync('startContainer.sh', `pm2 start index.js`);

                    console.log('create container');
                    child_process.execSync('bash ./createContainer.sh');
                    console.log('start container');
                    child_process.execSync('bash ./startContainer.sh');
                    console.log('ok');
                    done = true;  
                    res.json( { type: 'success', port: port, address: `vps-fr.sudocode1.xyz:${port}` } );
                }
            }

            console.log('f');

                      
        });          
    }

    
});