# Azadidroid
*free your phone from google*

Automated installation of google free Android distributions - easier than ever before!

This is fully written in JavaScript, which allows us in the next step to port it to the browser (using WebUSB) to make it even easier for people to get a google free and updated android on their phone.

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