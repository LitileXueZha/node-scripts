const dns = require('dns');
const net = require('net');

const TIMEOUT = 2000;

async function main() {
    const { count = 4, host, port } = normalizeArgs();
    if (!host) {
        process.stdout.write('No host input\n');
        return;
    }
    let ip = host;
    if (!net.isIP(host)) {
        ip = await lookup(host).catch((err) => {
            console.log('LookupError:', err.message);
            process.exit(1);
        });
    }
    console.log(
        'PING %s:%f%s TCP connections:',
        host, port,
        ip === host ? '' : ` (${ip})`,
    );
    let max = 0, min = TIMEOUT, avg = 0, n = 0;
    for (let i = 0; i < count; i++) {
        const { res, t } = await tcping(ip, port);
        switch (res) {
            case 'ok':
                console.log(
                    'Connected %s:%d/tcp: time=%dms',
                    ip, port, t,
                );
                max = Math.max(max, t);
                min = Math.min(min, t);
                avg += t;
                n ++;
                break;
            case 'timeout':
                console.log('Timeout.');
                break;
            case 'error':
                console.log('Network error.');
                break;
            default:
                break;
        }
    }
    avg /= n;
    console.log('\nPing statistics for [%s:%d]:', host, port);
    console.log(
        '   %d connections, %f\% failures, avg=%fms, max=%fms, min=%fms.',
        count, formatPoint((count - n) * 100 / count, 2),
        formatPoint(avg, 2), max, min,
    );
}

function lookup(hostname) {
    return new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address, family) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(address);
        });
    });
}

function tcping(ip, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const t = Date.now();
        const end = (res) => {
            const info = { res, t: Date.now() - t };
            socket.once('close', () => resolve(info));
            socket.destroy();
        };
        socket.on('error', () => end('error'));
        socket.setTimeout(TIMEOUT, () => end('timeout'));
        socket.connect(port, ip, () => end('ok'));
    });
}

function normalizeArgs() {
    const options = {};
    let skip = false;
    for (let i = 2, len = process.argv.length; i < len; i++) {
        if (skip) {
            skip = false;
            continue;
        };
        const arg = process.argv[i];
        if (arg[0] === '-') {
            skip = true;
            switch (arg.substring(1)) {
                case 'n':
                    options.count = +process.argv[i + 1];
                    break;
                default:
                    break;
            }
        } else {
            options.host = arg;
            options.port = +process.argv[i + 1] || 80;
            break;
        }
    }
    return options;
}

function formatPoint(number, units = 0) {
    if (units = 0) {
        return parseInt(number, 10);
    }
    let str = number.toFixed(units);
    str = str.replace(/\.0+$/, '');
    return str;
}

main();
