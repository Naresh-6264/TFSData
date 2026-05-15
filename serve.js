/**
 * Local Dev Server for Casepoint Tools Portal
 * =============================================
 * Serves static files + proxies TFS API requests via NTLM auth.
 *
 * Usage:   node serve.js
 * Open:    http://localhost:3000
 *
 * Zero npm dependencies. Uses curl --ntlm under the hood for TFS calls.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const url = require('url');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.txt': 'text/plain'
};

const server = http.createServer(function (req, res) {
    const parsed = url.parse(req.url, true);

    /* ─── TFS PROXY ─── */
    if (parsed.pathname === '/tfs-proxy') {
        var targetUrl = parsed.query.url;
        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
            return;
        }

        /* CORS preflight */
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                'Access-Control-Max-Age': '86400'
            });
            res.end();
            return;
        }

        /* Read request body for POST/PATCH */
        var bodyChunks = [];
        req.on('data', function (chunk) { bodyChunks.push(chunk); });
        req.on('end', function () {
            var body = Buffer.concat(bodyChunks).toString();
            var pat = '';

            /* Extract PAT from Authorization header */
            var authHeader = req.headers['authorization'] || '';
            if (authHeader.startsWith('Basic ')) {
                try {
                    var decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
                    pat = decoded.replace(/^:/, '');
                } catch (e) { /* ignore */ }
            }

            /* Build curl command */
            var args = ['-s', '--ntlm', '-u', ':' + pat];
            args.push('-X', req.method);

            /* Forward Content-Type */
            var ct = req.headers['content-type'];
            if (ct) args.push('-H', 'Content-Type: ' + ct);

            if (body && req.method !== 'GET' && req.method !== 'HEAD') {
                args.push('-d', body);
            }

            args.push(targetUrl);

            execFile('curl', args, { maxBuffer: 10 * 1024 * 1024 }, function (err, stdout, stderr) {
                var cors = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                    'Content-Type': 'application/json'
                };

                if (err) {
                    res.writeHead(502, cors);
                    res.end(JSON.stringify({ error: 'Proxy error: ' + (stderr || err.message) }));
                    return;
                }

                res.writeHead(200, cors);
                res.end(stdout);
            });
        });
        return;
    }

    /* ─── STATIC FILES ─── */
    var filePath = path.join(ROOT, parsed.pathname === '/' ? 'index.html' : parsed.pathname);

    /* Security: prevent path traversal */
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, function (err, stat) {
        if (err || !stat.isFile()) {
            /* Try index.html in directory */
            var indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, function (err2, stat2) {
                if (!err2 && stat2.isFile()) {
                    serveFile(indexPath, res);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not found: ' + parsed.pathname);
                }
            });
            return;
        }
        serveFile(filePath, res);
    });
});

function serveFile(filePath, res) {
    var ext = path.extname(filePath).toLowerCase();
    var mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, function () {
    console.log('');
    console.log('  Casepoint Tools Portal');
    console.log('  ======================');
    console.log('  Local:  http://localhost:' + PORT);
    console.log('  Proxy:  http://localhost:' + PORT + '/tfs-proxy?url=<TFS_URL>');
    console.log('');
    console.log('  Open http://localhost:' + PORT + ' in your browser.');
    console.log('  Press Ctrl+C to stop.');
    console.log('');
});
