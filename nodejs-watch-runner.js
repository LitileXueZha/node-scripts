const vm = require('vm');
const path = require('path');
const fs = require('fs');
const events = require('events');
const { spawn } = require('child_process');

const $ev = new events();

async function main() {
    const entry = resolveEntryFile();
    const workDir = path.dirname(entry);
    // console.log(workDir, entry);
    const watchers = new Map();
    $ev.on('depchange', (deps) => {
        console.log(deps, new Date());
        for (const [, oldWatcher] of watchers) {
            if (deps.indexOf(oldWatcher.__moduleId) === -1) {
                oldWatcher.close();
                watchers.delete(oldWatcher.__modulePath);
            }
        };
        for (let i = 0, len = deps.length; i < len; i++) {
            const name = path.join(workDir, deps[i]);
            if (!watchers.has(name)) {
                try {
                    const watcher = watchFile(name, () => $ev.emit('filechange'));
                    watcher.__moduleId = deps[i];
                    watcher.__modulePath = name;
                    watchers.set(name, watcher);
                } catch (e) {
                    console.log(e.message);
                }
            }
        }
    });
    let cp;
    const spawnArgs = [entry, ...process.argv.slice(3)];
    const runScript = () => {
        cp?.kill('SIGTERM');
        cp = spawn('node', spawnArgs, {
            stdio: 'inherit',
        });
    };
    $ev.on('filechange', debounce(() => {
        console.log('restart');
        runScript();
    }));
    process.chdir(workDir); // just ok
    runScript();
    startWatch(entry);
}

const isFileModule = (m) => m[0] === '.' || m[0] === '/';

function resolveEntryFile() {
    let entry = process.argv[2];
    if (!entry) {
        entry = ''; // current project
        // console.log('No input %o file', '.js');
        // process.exit(1);
        // return;
    }
    try {
        // Maybe omit relative/absolute path prefix,
        // nodejs will treat it in node_modules.
        if (!isFileModule(entry)) {
            entry = path.resolve(entry);
        }
        return require.resolve(entry);
    } catch (e) {
        console.log('Cannot resolve file %o', entry);
        process.exit(1);
    }
}

function startWatch(filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(err);
            process.exit(3);
            return;
        }
        const onChange = (ev, newBuff) => {
            if (ev === 'rename') {
                console.log('%o deleted', filePath);
                process.exit(0);
                return;
            }
            const deps = findDependencies(newBuff.toString());
            $ev.emit('depchange', deps);
            $ev.emit('filechange');
        };
        const deps = findDependencies(data.toString());
        $ev.emit('depchange', deps);
        watchFile(filePath, onChange, data);
    });
}

function watchFile(filePath, listener, buff = Buffer.allocUnsafe(0)) {
    // Users may modified file very frequently (<150ms),
    // but system fired "change" event one more times
    // very short (<10ms), so the better debounce
    // duration could be [50,100)ms.
    const watcher = fs.watch(filePath, debounce((eventType, filename) => {
        if (eventType === 'rename') {
            listener(eventType);
            buff = null;
            return;
        }
        fs.readFile(filePath, (err, data) => {
            if (err) {
                return;
            }
            if (data.equals(buff)) {
                return;
            }
            buff = data;
            listener(eventType, data);
        });
    }));
    return watcher;
}

function findDependencies(rawContent) {
    const deps = [];
    const everythingIsObject = () => {};
    const fakeModule = new Proxy({}, { get: () => everythingIsObject });
    const fakeRequire = (m) => {
        deps.push(m);
        return fakeModule;
    };
    const context = vm.createContext({ require: fakeRequire, process });
    try {
        vm.runInContext(rawContent, context, {
        // vm.runInContext(`try{${rawContent}}catch(e){}`, context, {
            filename: '__VM_CONTEXT__',
            breakOnSigint: true,
            timeout: 500,
        });
    } catch (e) {}
    // } catch (e) {console.error(e)}
    return deps.filter(isFileModule);
}

function debounce(fn, duration = 50) {
    let timer;
    return (...args) => {
        // console.log((!globalThis.t && (globalThis.t=Date.now()),Date.now()-globalThis.t), (globalThis.t=Date.now(),''));
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), duration);
    };
}

process.on('unhandledRejection', (reason) => {
    if (reason.stack.indexOf('__VM_CONTEXT__') > 0) {
        return;
    }
    console.error(reason);
});
main();
