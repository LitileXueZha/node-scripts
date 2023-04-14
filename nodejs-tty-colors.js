const util = require('util');

function main() {
    const {colors} = util.inspect;
    const mode = Object.keys(colors);
    const columnOfPreview = 4;

    for (let i = 0, len = mode.length; i < len; i++) {
        const n = colors[mode[i]][0];
        if (i % columnOfPreview === 0) {
            process.stdout.write('\n');
        }
        process.stdout.write(`\x1b[${n}m\\x1b[${n}m####\\x1b[m\x1b[m\t`);
    }

    const tips = [];
    const columnOfTips = 3;
    const maxLine = parseInt(mode.length / columnOfTips, 10);
    let lineNo = 0;
    for (let i = 0, len = mode.length; i < len; i++) {
        const n = colors[mode[i]][0];
        if (i % maxLine === 0) {
            lineNo = 0;
        }
        if (i < maxLine) {
            tips[i] = [];
        }
        tips[lineNo].push(`\x1b[90m\\x1b[${n}m\x1b[m`);
        tips[lineNo].push(mode[i]);
        lineNo ++;
    }
    process.stdout.write('\n\n');
    pretty(tips);
}
main();

function pretty(logs) {
    const BASE = 2;
    const paddings = [];
    for (let i = 0, len = logs.length; i < len; i++) {
        for (let j = 0, lenn = logs[i].length; j < lenn; j++) {
            paddings[j] = Math.max(logs[i][j].length, paddings[j] || 0);
        }
    }
    for (let i = 0, len = logs.length; i < len; i++) {
        for (let j = 0, lenn = logs[i].length; j < lenn; j++) {
            let str = logs[i][j];
            process.stdout.write(str);
            const padLength = paddings[j] - str.length + BASE;
            for (let k = 0; k < padLength; k++) {
                process.stdout.write(' ');
            }
        }
        process.stdout.write('\n');
    }
}
