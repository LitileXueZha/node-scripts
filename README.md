# node-scripts

Some useful scripts in Node.js

## [migrate-checkupdate-package-info](migrate-checkupdate-package-info.js)

When migrating, check update the dependencies in `package.json`. Example:

```shell
$ cd /path/to/your-project
$ node migrate-checkupdate-package-info.js
- 'electron' 17.4.7 -> 21.3.1 BREAKING CHANGES!
   Useful infomations:
    - Homepage: https://github.com/electron/electron#readme
    - Repository: { type: 'git', url: 'git+https://github.com/electron/electron.git' }        
    - See: https://github.com/electron/electron/releases/tag/v21.0.0

- 'front-matter' 
- '@primer/primitives' 7.5.0 -> 7.10.0
✗ 'js-yaml' 
- 'marked' 4.0.12 -> 4.2.3
```

## [tools-net-tcping](tools-net-tcping.js)

Check TCP connections. See also [tcping](https://www.elifulkerson.com/projects/tcping.php).

```shell
$ node tools-net-tcping.js www.example.org
$ node tools-net-tcping.js -n 4 example.org 443
PING www.example.org:443 (93.184.216.34) TCP connections:
Connected 93.184.216.34:443/tcp: time=150ms
Timeout.
Network error.
Connected 93.184.216.34:443/tcp: time=167ms

Ping statistics for [www.example.org:443]:
   4 connections, 15% failures, avg=157ms, max=167ms, min=150ms.
```

### Arguments

|Arg|Description|Default||
|-|-|-|-|
|`-n`|Count of connections|**`4`**|-|
|Hostname|-|-|Required|
|Port|-|**`80`**|-|
