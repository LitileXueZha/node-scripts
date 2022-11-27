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
