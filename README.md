# flint: A linter for EasyList-style filters

[![EasyList](https://github.com/mjethani/flint/actions/workflows/easylist.yml/badge.svg)](https://github.com/mjethani/flint/actions/workflows/easylist.yml)

[![EasyPrivacy](https://github.com/mjethani/flint/actions/workflows/easyprivacy.yml/badge.svg)](https://github.com/mjethani/flint/actions/workflows/easyprivacy.yml)

[![uBlock Origin](https://github.com/mjethani/flint/actions/workflows/ublock.yml/badge.svg)](https://github.com/mjethani/flint/actions/workflows/ublock.yml)

### Installation

```
npm i -g flint-tool
```

### Usage

```
flint --version
flint easylist.txt
```

### Development

```
git clone https://github.com/mjethani/flint.git
cd flint
npm i
npm run fetch-lists
./flint --list-rules
./flint lists/adblockplus/*.txt
./flint --compat=ublock lists/ublock/*.txt
```

### Report

Every ~4 hours at [manishjethani.io/flint/report.html](https://manishjethani.io/flint/report.html)

### Integration

__GitHub Actions__: [example.yml](https://gist.github.com/mjethani/eb43063309fde1fce1b29b95304a68b0)

---

&copy; 2021 Manish Jethani
