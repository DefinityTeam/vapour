"use strict";
// todo list:
// - [x] JavaScript to TypeScript
// - [-] sync to async
// - [x] clean up duplicated code
// - [ ] Google Fonts -> local fonts
// - [x] get rid of useless shit (unused commented code) -roux
// - [x] MAKE SURE THERE IS A COMPILED JS FILE THE LAUNCHER CAN RUN IN THE GITHUB REPO WHEN YOU PUSH -roux
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require('dotenv').config();
var express = require('express');
var fs = require("node:fs");
var js_sha256_1 = require("js-sha256");
var JSZip = require('jszip');
var node_path_1 = require("node:path");
var app = express();
var fileUpload = require('express-fileupload');
var ipArray;
var toSend;
var envFile;
app.use(express.urlencoded({ extended: false, limit: "922337203685477580711000000000kb" }));
app.use(fileUpload({ debug: false }));
function checkIP(intake) {
    intake = intake.replace('::ffff:', '');
    ipArray = JSON.parse(process.env['IPLIST']);
    switch (process.env['IPTYPE']) {
        case 'BLOCKSPECIFIC':
            if (ipArray.includes(intake))
                return true;
            break;
        case 'BLOCKALL':
            if (!ipArray.includes(intake))
                return true;
            break;
        default:
            return false;
    }
}
function xForwardedFor(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (checkIP(req.header('x-forwarded-for') || req.connection.remoteAddress))
                return [2 /*return*/, res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>')];
            next();
            return [2 /*return*/];
        });
    });
}
app.get('*', xForwardedFor);
app.post('*', xForwardedFor);
app.get('/', function (req, res) {
    fs.readFile('./public/index.html', 'utf-8', function (err, data) {
        res.send(data);
    });
});
app.get('/dashboard', function (req, res) { res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>'); });
app.post('/dashboard', function (req, res) {
    if ((process.env['LOGIN'] == (0, js_sha256_1.sha256)(req.body.username)) && (process.env['PASSWORD'] == (0, js_sha256_1.sha256)(req.body.password))) {
        res.send(fs.readFileSync('./public/dashboard.html', 'utf-8'));
        fs.appendFileSync('./private/accesslogs.txt', "successful dashboard access at ".concat(new Date().toLocaleDateString(), " ").concat(new Date().toLocaleTimeString(), "\n"));
    }
    else {
        res.send('incorrect details');
        fs.appendFileSync('./private/accesslogs.txt', "failed dashboard access at ".concat(new Date().toLocaleDateString(), " ").concat(new Date().toLocaleTimeString(), "\n"));
    }
});
app.get('/dashboard/*', function (req, res) { return res.status(405).send('<center><h1>405 Method Not Allowed</h1><hr><p>vapour-server</p></center>'); });
app.post('/dashboard/:page', function (req, res) {
    if (!(req.body['username'] && req.body['password'] && req.body['username'].length > 2 && req.body['password'].length > 2 && (0, js_sha256_1.sha256)(req.body['username']) == process.env['LOGIN'] && (0, js_sha256_1.sha256)(req.body['password']) == process.env['PASSWORD'])) {
        return res.status(403).send('<center><h1>403 Forbidden</h1><hr><p>vapour-server</p></center>');
    }
    switch (req.params['page']) {
        case 'files':
            toSend = fs.readFileSync('./public/dashboard/files.html', 'utf-8');
            toSend += '<span>';
            var directories_1 = "";
            var files_1 = "";
            fs.readdirSync('./private/').forEach(function (file) {
                try {
                    fs.readdirSync("./private/".concat(file));
                    directories_1 += "<input type=\"checkbox\" onclick=\"return false;\" readonly=\"readonly\" disabled=\"disabled\" id=\"".concat(file, "\"><label for=\"").concat(file, "\"> ").concat(file, "</label><br>");
                }
                catch (e) {
                    files_1 += "<input type=\"checkbox\" name=\"".concat(file, "\" id=\"").concat(file, "\"><label for=\"").concat(file, "\"> ").concat(file, "</label><br>");
                }
            });
            toSend += directories_1;
            toSend += files_1;
            toSend += '</span></form></body></html>';
            res.send(toSend);
            break;
        case 'serviceconfig':
            fs.readFile("./private/accesslogs.txt", 'utf8', function (logErr, logData) {
                if (logErr) {
                    res.status(500).send('<center><h1>500 Internal Server Error</h1><hr><p>vapour-server</p></center>');
                }
                ;
                fs.readFile("./public/dashboard/serviceconfig.html", 'utf8', function (pageErr, pageData) {
                    if (pageErr) {
                        res.status(500).send('<center><h1>500 Internal Server Error</h1><hr><p>vapour-server</p></center>');
                    }
                    ;
                    res.send("".concat(pageData, "<script>document.getElementById('logs').value = `").concat(logData, "`</script>"));
                });
            });
            break;
        default:
            fs.access("./public/dashboard/".concat(req.params['page'], ".html"), fs.constants.R_OK, function (err) {
                if (err) {
                    res.status(404).send('<center><h1>404 Not Found</h1><hr><p>vapour-server</p></center>');
                }
                ;
                fs.readFile("./public/dashboard/".concat(req.params['page'], ".html"), 'utf8', function (err, data) { res.send(data); });
            });
    }
});
app.post('/download', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var zip, _i, _a, path, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                zip = new JSZip();
                for (_i = 0, _a = Object.entries(req.body); _i < _a.length; _i++) {
                    path = _a[_i];
                    if (path[0] == "encryption_key")
                        continue; // REMOVE THIS PARAMETER ON CLIENT END IF USED. DO NOT DO THIS SERVER SIDE. WE WILL PROVIDE A DECRYPTION TOOL.
                    zip.file((0, node_path_1.basename)(path[0]), fs.readFileSync("./private/".concat(path[0])));
                }
                res.setHeader('content-disposition', 'attachment; filename=files.zip');
                res.setHeader('content-type', 'application/zip');
                _c = (_b = res).send;
                return [4 /*yield*/, zip.generateAsync({ type: 'nodebuffer' })];
            case 1:
                _c.apply(_b, [_d.sent()]);
                return [2 /*return*/];
        }
    });
}); });
app.post('/upload', function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    console.log(req.files.f);
    (Array.isArray(req.files.f) ? req.files.f : [req.files.f]).forEach(function (file) {
        file.mv('./private/' + file.name, function (err) {
            if (err)
                return res.status(500).send(err);
        });
    });
    res.send('ok'); // make this redirect back to dash at some point (roux do this not jb)
});
app.post('/api/file/:file', function (req, res) {
    try {
        res.status(200).sendFile(require('path').join(process.cwd(), 'private/' + req.params.file));
    }
    catch (e) {
        res.status(500).send('file not found');
    }
});
app.post('/options', function (req, res) {
    if (!Object.entries(req.body).length)
        return res
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
        if ((0, js_sha256_1.sha256)(req.body['oldPassword']) == process.env['PASSWORD']) {
            process.env['PASSWORD'] = (0, js_sha256_1.sha256)(req.body['newPassword']);
            envFile[2] = 'PASSWORD=' + (0, js_sha256_1.sha256)(req.body['newPassword']);
        }
        else {
            return res
                .status(400)
                .send('<center><h1>400 Bad Request</h1><hr><p>vapour-server</p></center>');
        }
    }
    fs.writeFileSync('.env', envFile.join('\n'));
    try {
        res.send('success');
    }
    catch (e) {
        return;
    }
});
app.post('/postAny', function (req, res) {
    console.log(req.body);
});
app.get('*', function (req, res) {
    res
        .status(404)
        .send('<center><h1>404 Not Found</h1><hr><p>vapour-server</p></center>');
});
app.listen(process.env['PORT'], function () { console.log("Online at ".concat(process.env['PORT'])); });
