# Azadidroid
*free your phone from google*

https://azadidroid.app 

Automated installation of google free Android distributions - easier than ever before!

## Project Overview
| Folder            | Purpose 
|-------------------|--------------------------------------------------------------------------------------------|
| `azadidroid-data` | Available ROMs, informations about models
| `azadidroid-lib`  | Logic for automatic installation of android ROMs (utilizing [heimdall.js](https://github.com/alangecker/heimdall.js), [fastboot.js](https://github.com/alangecker/fastboot.js) and [ya-webadb](https://github.com/yume-chan/ya-webadb))
| `azadidroid-cli`  | command line tool using `azadidroid-lib`
| `azadidroid-web`  | Web GUI using `azadidroid-lib`. deployed under https://azadidroid.app


## Supported 
it is an early version. Lot's of devices probably aren't supported yet.

### ROM's
- LineageOS
- /e/ OS
- GrapheneOS
- CalyxOS
- Proton AOSP
- DivestOS
- iodéOS


## Setup
```bash
git clone --recurse-submodules https://github.com/alangecker/azadidroid.git
cd azadidroid
yarn install
```

## Run CLI
```bash
yarn azadidroid
```

## Run web development server
```bash
yarn web-dev
```