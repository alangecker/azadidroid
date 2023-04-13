# Azadidroid
*free your phone from google*

Automated installation of google free Android distributions - easier than ever before!

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

cd ../azadidroid-lib
yarn link heimdall.js
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