
export default {
    errors: {
        noDevice: {
            message: "No device found",
            // TODO: add instructions to enable ADB
            hintsTitle: 'Device not showing up? Try following these steps:',
            hints: [
                'Make sure the phone is connected',
                'Use a different cable',
                'Clean your USB port',
                'Don’t use USB hubs',
                'Make sure the cable isn’t loose'
            ],
        },
        deviceInUse: {
            message: "Can’t control device",
            hintsTitle: 'Another app is taking control of your device, so we can’t talk to it. Try following:',
            hints: [
                'run `adb kill-server` in a Terminal',
                // TODO: other hints
            ],
        },
    },
    stepTitle: {
        'confirm_android_version': 'Verify current android version',
        'allow_oem_unlock': 'Allow OEM Unlock',
        'fastboot_unlock': 'Unlock Bootloader',
        'wait_for_bootloader': 'Reboot into the bootloader',
        'odin_flash_recovery': 'Flash recovery',
        'fastboot_boot_recovery': 'Boot recovery',
        'reboot_to_recovery': 'Reboot into recovery',
        'twrp_wipe': 'Wipe all data',
        'twrp_install_rom': 'Installing ROM',
        'twrp_finish': 'Finishing up'
    }
}