/**
 * fastboot.js is written in typescript, but the types are
 * currently not included in the npm package
 */
declare module 'android-fastboot' {

    interface CommandResponse {
        text: string;
        // hex string from DATA
        dataSize?: string;
    }

    export function setDebugLevel(level: number);

    /**
     * Callback for progress updates while flashing or uploading an image.
     *
     * @callback FlashProgressCallback
     * @param {number} progress - Progress for the current action, between 0 and 1.
     */
    export type FlashProgressCallback = (progress: number) => void;

    /**
     * Callback for reconnecting to the USB device.
     * This is necessary because some platforms do not support automatic reconnection,
     * and USB connection requests can only be triggered as the result of explicit
     * user action.
     *
     * @callback ReconnectCallback
     */
    export type ReconnectCallback = () => void;

    /**
     * Callback for factory image flashing progress.
     *
     * @callback FactoryProgressCallback
     * @param {string} action - Action in the flashing process, e.g. unpack/flash.
     * @param {string} item - Item processed by the action, e.g. partition being flashed.
     * @param {number} progress - Progress within the current action between 0 and 1.
     */
    export type FactoryProgressCallback = (
        action: string,
        item: string,
        progress: number
    ) => void;

    export class FastbootDevice {
        device: USBDevice | null;
        epIn: number | null;
        epOut: number | null;
        _registeredUsbListeners: boolean
    
        /**
         * Create a new fastboot device instance. This doesn't actually connect to
         * any USB devices; call {@link connect} to do so.
         */
        constructor()


        /**
         * Returns whether a USB device is connected and ready for use.
         */
        get isConnected()

        /**
         * Validate the current USB device's details and connect to it.
         *
         * @private
         */
        _validateAndConnectDevice(): Promise<any>

        /**
         * Wait for the current USB device to disconnect, if it's still connected.
         * Returns immediately if no device is connected.
         */
        waitForDisconnect(): Promise<any>

        /**
         * Wait for the USB device to connect. Returns at the next connection,
         * regardless of whether the connected USB device matches the previous one.
         *
         * @param {ReconnectCallback} onReconnect - Callback to request device reconnection on Android.
         */
        waitForConnect(onReconnect?: ReconnectCallback): Promise<any>

        /**
         * Request the user to select a USB device and connect to it using the
         * fastboot protocol.
         *
         * @throws {UsbError}
         */
        connect(): Promise<any>

        /**
         * Send a textual command to the bootloader and read the response.
         * This is in raw fastboot format, not AOSP fastboot syntax.
         *
         * @param {string} command - The command to send.
         * @returns {Promise<CommandResponse>} Object containing response text and data size, if any.
         * @throws {FastbootError}
         */
        runCommand(command: string): Promise<CommandResponse>

        /**
         * Read the value of a bootloader variable. Returns undefined if the variable
         * does not exist.
         *
         * @param {string} varName - The name of the variable to get.
         * @returns {Promise<string>} Textual content of the variable.
         * @throws {FastbootError}
         */
        getVariable(varName: string): Promise<string | null>

        /**
         * Upload a payload to the bootloader for later use, e.g. flashing.
         * Does not handle raw images, flashing, or splitting.
         *
         * @param {string} partition - Name of the partition the payload is intended for.
         * @param {ArrayBuffer} buffer - Buffer containing the data to upload.
         * @param {FlashProgressCallback} onProgress - Callback for upload progress updates.
         * @throws {FastbootError}
         */
        upload(
            partition: string,
            buffer: ArrayBuffer,
            onProgress?: FlashProgressCallback
        ): Promise<any>

        /**
         * Reboot to the given target, and optionally wait for the device to
         * reconnect.
         *
         * @param {string} target - Where to reboot to, i.e. fastboot or bootloader.
         * @param {boolean} wait - Whether to wait for the device to reconnect.
         * @param {ReconnectCallback} onReconnect - Callback to request device reconnection, if wait is enabled.
         */
        reboot(
            target: string,
            wait: boolean,
            onReconnect?: ReconnectCallback
        ): Promise<any>

        /**
         * Flash the given Blob to the given partition on the device. Any image
         * format supported by the bootloader is allowed, e.g. sparse or raw images.
         * Large raw images will be converted to sparse images automatically, and
         * large sparse images will be split and flashed in multiple passes
         * depending on the bootloader's payload size limit.
         *
         * @param {string} partition - The name of the partition to flash.
         * @param {Blob} blob - The Blob to retrieve data from.
         * @param {FlashProgressCallback} onProgress - Callback for flashing progress updates.
         * @throws {FastbootError}
         */
        flashBlob(
            partition: string,
            blob: Blob,
            onProgress?: FlashProgressCallback
        ): Promise<any>

        /**
         * Boot the given Blob on the device.
         * Equivalent to `fastboot boot boot.img`.
         *
         * @param {Blob} blob - The Blob to retrieve data from.
         * @param {FlashProgressCallback} onProgress - Callback for flashing progress updates.
         * @throws {FastbootError}
         */
        bootBlob(
            blob: Blob,
            onProgress?: FlashProgressCallback
        ): Promise<any>

        /**
         * Flash the given factory images zip onto the device, with automatic handling
         * of firmware, system, and logical partitions as AOSP fastboot and
         * flash-all.sh would do.
         * Equivalent to `fastboot update name.zip`.
         *
         * @param {Blob} blob - Blob containing the zip file to flash.
         * @param {boolean} wipe - Whether to wipe super and userdata. Equivalent to `fastboot -w`.
         * @param {ReconnectCallback} onReconnect - Callback to request device reconnection.
         * @param {FactoryProgressCallback} onProgress - Progress callback for image flashing.
         */
        flashFactoryZip(
            blob: Blob,
            wipe: boolean,
            onReconnect: ReconnectCallback,
            onProgress?: FactoryProgressCallback
        ): Promise<any>
    }

    
}
