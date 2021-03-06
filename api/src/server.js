const config = require('./../config/config.json');

const rateLimit = require('express-rate-limit');
const express = require('express');

const common = require('./common');
const pluginLoader = require('./pluginLoader');

const https = require('https');
const ws = require('ws');
const fs = require('fs');

const wsServer = new ws.Server({ noServer: true });
const app = express();

// Allow accessing raw body data of requests
app.use((req, res, next) => {
    var data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
        req.rawBody = data;
        next();
    });
});

/**
 * Setup Server
 * @param {Object} plugins Plugins to load
 * @param {Boolean} debug Debug mode
 */
function init(plugins, debug) {
    // Debug mode
    if (debug)
        app.use('/EXIT', (req, res) => {
            res.send('ok');
            common.log('🛑 Server is exiting...');
            process.exit(0);
        });

    // Add Rate-Limiting
    // (Disabled in debug mode)
    if (config.server.rateLimit.enabled && !debug)
        app.use(
            rateLimit({
                windowMs: config.server.rateLimit.window,
                max: config.server.rateLimit.max
            })
        );

    // Inject plugins
    // App args are passed to each plugin
    let inject = pluginLoader.inject(plugins, api =>
        api(app, wsServer, config, debug)
    );

    // Serve static content
    if (config.server.static.serveStatic)
        app.use(express.static(config.server.static.staticFolder));

    // Load default 
    if (inject.loadDefault) {
        common.log('🚓 Loading default API');
        require('./routes').webSocket(wsServer, debug);
    }

    // Add a 404 Page
    // Will stream the /static/404.html file
    app.use((req, res, next) => {
        res.status(404);
        req.header
        common.streamFile('../static/404/index.html', res);
    });
}

/**
 *  Start Server (Http)
 */
function start(ip, port) {
    app.listen(config.server.port, config.server.ip, () =>
        common.log(`🐍 Serving http://${ip}:${port}/`)
    ).on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, socket => {
            wsServer.emit('connection', socket, request);
            common.log(
                `✅️ WebSocket Connected`,
                '',
                socket._socket.remoteAddress
            );
        });
    });
}

/**
 *  Start Server (Https)
 */
// prettier-ignore
function startTls(ip, port) {
    let key = fs.readFileSync(config.server.tls.key);
    let cert = fs.readFileSync(config.server.tls.cert);
    https.createServer({ key: key, cert: cert }, app)
        .listen(port, ip, () =>
            common.log(`🐍 Serving https://${ip}:${port}/`)
        ).on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
                common.log(
                    `✅️ WebSocket Connected`,
                    '',
                    socket._socket.remoteAddress
                );
            });
        });
}

module.exports = {
    startTls,
    start,
    init
};
