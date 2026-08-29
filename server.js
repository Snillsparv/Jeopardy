#!/usr/bin/env node
// Jeopardy LAN-server — kör spelet med telefoner som fjärrkontroll och buzzers.
//
//   Starta:   node server.js          (eller PORT=9000 node server.js)
//
//   På datorn/TV:n:   http://localhost:8080          (spelskärmen)
//   Programledaren:   http://<datorns-ip>:8080/host  (fjärrkontroll med facit)
//   Spelarna:         http://<datorns-ip>:8080/play  (buzzer)
//
// Servern har inga beroenden (bara Nodes standardbibliotek) och fungerar som:
//  1. statisk filserver för spelet
//  2. meddelandebuss: spelskärmen sänder sitt tillstånd, telefonerna sänder
//     kommandon, allt relayas till alla anslutna via Server-Sent Events (SSE)
//
// Ingen inloggning — tänkt för ett privat wifi under spelkvällen.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
};

// --- Meddelandebuss ---------------------------------------------------------

let sseClients = [];   // { id, res }
let nextClientId = 1;
let lastState = null;  // spelskärmens senaste tillståndsrapport

function broadcast(message) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    for (const client of sseClients) {
        client.res.write(data);
    }
}

function handleEvents(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.write('retry: 1000\n\n');

    const client = { id: nextClientId++, res };
    sseClients.push(client);

    // Ge nyanslutna det senaste tillståndet direkt
    if (lastState) {
        res.write(`data: ${JSON.stringify({ kind: 'state', state: lastState })}\n\n`);
    }

    req.on('close', () => {
        sseClients = sseClients.filter(c => c !== client);
    });
}

function handleAction(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 100_000) req.destroy(); // rimlig gräns
    });
    req.on('end', () => {
        let message;
        try {
            message = JSON.parse(body);
        } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end('{"error":"bad json"}');
            return;
        }

        if (message.kind === 'state') {
            lastState = message.state;
        }
        broadcast(message);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
    });
}

// --- Statiska filer ---------------------------------------------------------

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    // Spelskärmen får en flagga insprutad så remote.js vet att servern kör.
    // (Öppnas index.html utan denna server förblir fjärrläget helt avstängt.)
    if (path.basename(filePath) === 'index.html') {
        let html = fs.readFileSync(filePath, 'utf8');
        html = html.replace('<head>',
            '<head>\n    <script>window.JEOPARDY_SERVER = true;</script>');
        res.writeHead(200, { 'Content-Type': mime });
        res.end(html);
        return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
        res.writeHead(200, { 'Content-Type': mime });
        stream.pipe(res);
    });
    stream.on('error', () => {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404');
    });
}

function lanAddresses() {
    const addresses = [];
    for (const iface of Object.values(os.networkInterfaces())) {
        for (const addr of iface || []) {
            if (addr.family === 'IPv4' && !addr.internal) {
                addresses.push(addr.address);
            }
        }
    }
    return addresses;
}

// --- Router -----------------------------------------------------------------

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/events') return handleEvents(req, res);
    if (pathname === '/action' && req.method === 'POST') return handleAction(req, res);

    if (pathname === '/state') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ state: lastState }));
        return;
    }

    if (pathname === '/server-info') {
        const ips = lanAddresses();
        const ip = ips[0] || 'localhost';
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            jeopardy: true,
            port: PORT,
            hostUrl: `http://${ip}:${PORT}/host`,
            playUrl: `http://${ip}:${PORT}/play`,
            // Alla adresser, om datorn har flera nätverk (t.ex. VPN-adaptrar)
            addresses: ips,
        }));
        return;
    }

    // Snygga adresser för telefonsidorna
    let filePath = pathname;
    if (filePath === '/') filePath = '/index.html';
    if (filePath === '/host') filePath = '/host.html';
    if (filePath === '/play') filePath = '/play.html';

    // Logga sidanslutningar så man ser i terminalen att telefoner når fram
    if (pathname === '/' || pathname === '/host' || pathname === '/play') {
        const who = { '/': 'spelskärm', '/host': 'programledare', '/play': 'spelare' }[pathname];
        const from = (req.socket.remoteAddress || '').replace('::ffff:', '');
        console.log(`📱 ${who}-sidan öppnad från ${from}`);
    }

    // Stoppa försök att läsa utanför spelmappen
    const resolved = path.normalize(path.join(ROOT, filePath));
    if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
        res.writeHead(403);
        res.end('403');
        return;
    }

    serveFile(res, resolved);
});

// Håll SSE-anslutningar vid liv genom ombud/telefonviloläge
setInterval(() => {
    for (const client of sseClients) {
        client.res.write(': ping\n\n');
    }
}, 25_000);

server.listen(PORT, '0.0.0.0', () => {
    const ips = lanAddresses();
    console.log('');
    console.log('🎩 Jeopardy-servern kör!');
    console.log('');
    console.log(`   Spelskärm (denna dator):  http://localhost:${PORT}`);
    for (const ip of ips) {
        console.log(`   Programledarens telefon:  http://${ip}:${PORT}/host`);
        console.log(`   Spelarnas telefoner:      http://${ip}:${PORT}/play`);
    }
    if (!ips.length) {
        console.log('   (Ingen wifi-adress hittad — anslut datorn till nätverket)');
    }
    console.log('');
    console.log('   QR-koder för telefonerna visas på spelets startskärm.');
    console.log('   Avsluta med Ctrl+C.');
    console.log('');
});
