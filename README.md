# Azadidroid
*free your phone from google*

Automated installation of google free Android distributions - easier than ever before!

This is fully written in JavaScript, which allows us in the next step to port it to the browser (using WebUSB) to make it even easier for people to get a google free and updated android on their phone.

## Project Overview
| Folder            | Purpose 
|-------------------|--------------------------------------------------------------------------------------------|
| `azadidroid-data` | Available ROMs, informations about models
| `azadidroid-lib`  | Logic for automatic installation of android ROMs (utilizing heimdall.js and fastboot.js)
| `azadidroid-cli`  | command line tool using `azadidroid-lib`
| `azadidroid-web`  | Web GUI using `azadidroid-lib`


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

cd heimdall.js
yarn
yarn link

cd ../azadidroid-data
yarn
yarn link

cd ../azadidroid-lib
yarn link heimdall.js
yarn link azadidroid-data
yarn
yarn link

cd ../azadidroid-cli
yarn link azadidroid-lib
yarn
```

## Run
```bash
yarn azadidroid
```