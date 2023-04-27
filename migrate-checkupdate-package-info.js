const fs = require('fs/promises');
const os = require('os');
const events = require('events');
const https = require('https');
const util = require('util');
const dns = require('dns');

const TIMEOUT = 5000;
const REGISTRY = 'registry.npmjs.org';

async function main() {
    const rawContent = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(rawContent);
    await lookup(REGISTRY);
    checkUpdate(pkg.dependencies);
    checkUpdate(pkg.devDependencies);
    for (let i = 0; i < CPUs; i++) makeFetch();
    ev.on('fetch-all-done', () => process.exit(0));
}

const queue = [];
let fetching = 0;
const ev = new events();
const CPUs = Math.max(os.cpus().length, 8);

function checkUpdate(deps) {
    if (!deps) {
        return;
    }
    for (const name in deps) {
        queue.push({ name, version: deps[name] });
    }
}

function makeFetch() {
    if (fetching >= CPUs) {
        return;
    }
    const pkg = queue.shift();
    if (!pkg) return;
    fetching ++;
    const done = () => {
        fetching --;
        makeFetch();
        if (fetching === 0) {
            ev.emit('fetch-all-done');
        }
    };
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT);
    const url = `https://${REGISTRY}/${pkg.name}/latest`;
    const req = https.request(url, { signal: ac.signal, lookup });
    req.on('response', (res) => {
        clearTimeout(timer);
        const buff = [];
        res.on('data', (chunk) => buff.push(chunk));
        res.on('end', () => {
            const rawData = Buffer.concat(buff).toString();
            const latest = JSON.parse(rawData);
            outputStats({ pkg, latest });
            done();
        });
    });
    ac.signal.onabort = () => outputStats({ pkg, failed: true });
    req.on('error', done);
    req.end();
}

const dnsCache = {};
function lookup(hostname, opts, callback) {
    return new Promise((resolve, reject) => {
        if (hostname in dnsCache) {
            callback?.apply(null, dnsCache[hostname]);
            resolve();
            return;
        }
        dns.lookup(hostname, opts, (err, addr, family) => {
            if (err) {
                reject();
                return;
            }
            dnsCache[hostname] = [null, addr, family];
            callback?.(null, addr, family);
            resolve();
        });
    });
}

function outputStats(info) {
    const { pkg, latest, failed } = info;
    if (failed) {
        console.log("✗ '%s'", pkg.name);
    } else {
        const { major, colorStr } = checkMajor(pkg.version, latest.version);
        console.log('- %o', pkg.name, colorStr);
        if (major && pkg.name.indexOf('/') < 0) {
            console.log('   Useful infomations:');
            console.log('    - Homepage: %s', latest.homepage);
            console.log('    - Repository: %s', util.inspect(latest.repository, { breakLength: Infinity, colors: true }));
            if (latest.repository.type === 'git') {
                const url = latest.repository.url.replace('git+', '').replace('.git', '')
                // console.log('    - Releases: %s/releases', url);
                console.log('    - See: %s/releases/tag/v%s.0.0', url, major);
            }
            process.stdout.write('\n');
        }
    }
}

const REG_VER = /^[^0-9]/;
function checkMajor(old, current) {
    old = old.replace(REG_VER, '');
    const oldVers = old.split('.');
    const currVers = current.split('.');
    let colorStr = `${old} ->`;
    let major = false;
    if (currVers[0] !== oldVers[0]) {
        colorStr += ` \x1b[1m\x1b[31m${current}\x1b[0m`;
        colorStr += ' \x1b[7mBREAKING CHANGES!\x1b[0m'
        major = currVers[0];
    } else if (old === current) {
        colorStr = '';
    } else {
        const checkOther = (i) => {
            if (currVers[i] !== oldVers[i]) {
                currVers[i] = `\x1b[1m\x1b[4m${currVers[i]}\x1b[0m`;
            }
        };
        checkOther(1);
        checkOther(2);
        colorStr += ` ${currVers.join('.')}`
    }
    return { major, colorStr };
}

main();
