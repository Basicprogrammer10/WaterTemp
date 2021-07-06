const config = require('./../config/config.json');

const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const express = require('express');
const https = require('https');
const ws = require('ws');
const fs = require('fs');

const wsServer = new ws.Server({ noServer: true });
const app = express();
if (config.server.static.serveStatic)
    app.use(express.static(config.server.static.staticFolder));
if (config.server.rateLimit.enabled)
    app.use(
        rateLimit({
            windowMs: config.server.rateLimit.window,
            max: config.server.rateLimit.max
        })
    );
app.use(bodyParser.json());

/**
 *  Setup Server
 * @param {Object} plugins Plugins to load
 * @param {Boolean} debug Debug mode
 */
function init(plugins, debug) {
    // Debug mode
    if (debug)
        app.get('/EXIT', (req, res) => {
            res.send('ok');
            console.log('[*] Server is exiting...');
            process.exit(0);
        });

    // Load plugins
    let loadDefault = true;
    for (const key in plugins) {
        if ('disable' in plugins[key])
            if (plugins[key].disable) loadDefault = false;
        if ('api' in plugins[key]) {
            for (const fun in plugins[key].api) {
                plugins[key].api[fun](app, wsServer, config);
            }
        }
    }
    if (!loadDefault) return;
    console.log('[*] Loading default API');
    require('./routes').webSocket(wsServer, config);
}

/**
 *  Start Server Http
 */
function start(ip, port) {
    app.listen(config.server.port, config.server.ip, () =>
        console.log(`🐍 Serving http://${ip}:${port}/`)
    ).on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, socket => {
            wsServer.emit('connection', socket, request);
            console.log(`✔ WebSocket Connected`, socket._socket.remoteAddress);
        });
    });
}

/**
 *  Start Server Https
 */
// prettier-ignore
function startTls(ip, port) {
    let key = fs.readFileSync(config.server.tls.key);
    let cert = fs.readFileSync(config.server.tls.cert);
    https.createServer({ key: key, cert: cert }, app)
        .listen(port, ip, () =>
            console.log(`🐍 Serving https://${ip}:${port}/`)
        ).on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
                console.log(
                    `✔ WebSocket Connected`,
                    socket._socket.remoteAddress
                );
            });
        });
}

module.exports = {
    init: init,
    start: start,
    startTls: startTls
};
