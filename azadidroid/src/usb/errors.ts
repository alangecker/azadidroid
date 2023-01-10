export function isNoDeviceSelectedError(err: any) {
    return err.toString().includes("No device selected.") ||
        err.toString().includes("no devices found")
    // return (
    //     err instanceof DOMException &&
    //     err.name === "NotFoundError" &&
    //     err.message === "No device selected."
    // );
}

export function isConnectUdevError(err: any) {
    return (
        // err instanceof DOMException &&
        err.name === "SecurityError" &&
        err.message === "Access denied."
    );
}
export function isClaimError(err: any) {
    return (
        err.message.includes('LIBUSB_ERROR_BUSY') ||
        (
            // err instanceof DOMException &&
            err.message.includes("Unable to claim interface.")) ||
        (
            // err instanceof DOMException &&
            err.name === "InvalidStateError" &&
            err.message ===
                "An operation that changes the device state is in progress.")
    );
}