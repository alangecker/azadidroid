import { AdbPacketHeader, AdbPacketSerializeStream, type AdbPacketData, type AdbPacketInit } from '@yume-chan/adb';
import { DuplexStreamFactory, pipeFrom, ReadableStream, WritableStream, type ReadableWritablePair } from '@yume-chan/stream-extra';
import { EMPTY_UINT8_ARRAY, StructDeserializeStream } from '@yume-chan/struct';
import { webusb } from 'usb'

export const ADB_DEVICE_FILTER: USBDeviceFilter = {
    classCode: 0xFF,
    subclassCode: 0x42,
    protocolCode: 1,
};

class Uint8ArrayStructDeserializeStream implements StructDeserializeStream {
    private buffer: Uint8Array;

    private offset: number;

    public constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.offset = 0;
    }

    public read(length: number): Uint8Array {
        const result = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;
        return result;
    }
}

export class AdbWebUsbBackendStream implements ReadableWritablePair<AdbPacketData, AdbPacketInit>{
    private _readable: ReadableStream<AdbPacketData>;
    public get readable() { return this._readable; }

    private _writable: WritableStream<AdbPacketInit>;
    public get writable() { return this._writable; }

    public constructor(device: USBDevice, inEndpoint: USBEndpoint, outEndpoint: USBEndpoint) {
        const factory = new DuplexStreamFactory<AdbPacketData, Uint8Array>({
            close: async () => {
                try { await device.close(); } catch { /* device may have already disconnected */ }
            },
            dispose: async () => {
                webusb.removeEventListener('disconnect', handleUsbDisconnect);
            },
        });

        function handleUsbDisconnect(e: USBConnectionEvent) {
            if (e.device === device) {
                factory.dispose();
            }
        }

        webusb.addEventListener('disconnect', handleUsbDisconnect);

        this._readable = factory.wrapReadable(new ReadableStream<AdbPacketData>({
            async pull(controller) {
                // The `length` argument in `transferIn` must not be smaller than what the device sent,
                // otherwise it will return `babble` status without any data.
                // Here we read exactly 24 bytes (packet header) followed by exactly `payloadLength`.
                const result = await device.transferIn(inEndpoint.endpointNumber, 24);

                // TODO: webusb: handle `babble` by discarding the data and receive again
                // TODO: webusb: on Windows, `transferIn` throws an NetworkError when device disconnected, check with other OSs.

                // From spec, the `result.data` always covers the whole `buffer`.
                const buffer = new Uint8Array(result.data!.buffer);
                const stream = new Uint8ArrayStructDeserializeStream(buffer);

                // Add `payload` field to its type, because we will assign `payload` in next step.
                const packet = AdbPacketHeader.deserialize(stream) as AdbPacketHeader & { payload: Uint8Array; };
                if (packet.payloadLength !== 0) {
                    const result = await device.transferIn(inEndpoint.endpointNumber, packet.payloadLength);
                    packet.payload = new Uint8Array(result.data!.buffer);
                } else {
                    packet.payload = EMPTY_UINT8_ARRAY;
                }

                controller.enqueue(packet);
            },
        }));

        this._writable = pipeFrom(
            factory.createWritable(new WritableStream({
                write: async (chunk) => {
                    await device.transferOut(outEndpoint.endpointNumber, chunk);
                },
            }, {
                highWaterMark: 16 * 1024,
                size(chunk) { return chunk.byteLength; },
            })),
            new AdbPacketSerializeStream()
        );
    }
}