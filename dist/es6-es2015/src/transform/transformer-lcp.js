"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const crypto = require("crypto");
const zlib = require("zlib");
const RangeStream_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/stream/RangeStream");
const debug_ = require("debug");
const BufferUtils_1 = require("r2-utils-js/dist/es6-es2015/src/_utils/stream/BufferUtils");
const debug = debug_("r2:transformer:lcp");
const AES_BLOCK_SIZE = 16;
const readStream = (s, n) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const onReadable = () => {
            const b = s.read(n);
            s.removeListener("readable", onReadable);
            s.removeListener("error", reject);
            resolve(b);
        };
        s.on("readable", onReadable);
        s.on("error", reject);
    });
});
function transformStream(lcp, linkHref, linkPropertiesEncrypted, stream, isPartialByteRangeRequest, partialByteBegin, partialByteEnd) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let plainTextSize = -1;
        let nativelyDecryptedStream;
        if (lcp.isNativeNodePlugin()) {
            debug("DECRYPT: " + linkHref);
            let fullEncryptedBuffer;
            try {
                fullEncryptedBuffer = yield BufferUtils_1.streamToBufferPromise(stream.stream);
            }
            catch (err) {
                debug(err);
                return Promise.reject("OUCH!");
            }
            let nativelyDecryptedBuffer;
            try {
                nativelyDecryptedBuffer = yield lcp.decrypt(fullEncryptedBuffer);
            }
            catch (err) {
                debug(err);
                return Promise.reject("OUCH!");
            }
            plainTextSize = nativelyDecryptedBuffer.length;
            linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;
            if (linkPropertiesEncrypted.OriginalLength &&
                linkPropertiesEncrypted.Compression === "none" &&
                linkPropertiesEncrypted.OriginalLength !== plainTextSize) {
                debug(`############### ` +
                    `LCP transformStream() LENGTH NOT MATCH ` +
                    `linkPropertiesEncrypted.OriginalLength !== plainTextSize: ` +
                    `${linkPropertiesEncrypted.OriginalLength} !== ${plainTextSize}`);
            }
            nativelyDecryptedStream = BufferUtils_1.bufferToStream(nativelyDecryptedBuffer);
        }
        else {
            let cryptoInfo;
            let cypherBlockPadding = -1;
            if (linkPropertiesEncrypted.DecryptedLengthBeforeInflate > 0) {
                plainTextSize = linkPropertiesEncrypted.DecryptedLengthBeforeInflate;
                cypherBlockPadding = linkPropertiesEncrypted.CypherBlockPadding;
            }
            else {
                try {
                    cryptoInfo = yield getDecryptedSizeStream(lcp, stream);
                }
                catch (err) {
                    debug(err);
                    return Promise.reject(err);
                }
                plainTextSize = cryptoInfo.length;
                cypherBlockPadding = cryptoInfo.padding;
                linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;
                linkPropertiesEncrypted.CypherBlockPadding = cypherBlockPadding;
                try {
                    stream = yield stream.reset();
                }
                catch (err) {
                    debug(err);
                    return Promise.reject(err);
                }
                if (linkPropertiesEncrypted.OriginalLength &&
                    linkPropertiesEncrypted.Compression === "none" &&
                    linkPropertiesEncrypted.OriginalLength !== plainTextSize) {
                    debug(`############### ` +
                        `LCP transformStream() LENGTH NOT MATCH ` +
                        `linkPropertiesEncrypted.OriginalLength !== plainTextSize: ` +
                        `${linkPropertiesEncrypted.OriginalLength} !== ${plainTextSize}`);
                }
            }
        }
        if (partialByteBegin < 0) {
            partialByteBegin = 0;
        }
        if (partialByteEnd < 0) {
            partialByteEnd = plainTextSize - 1;
            if (linkPropertiesEncrypted.OriginalLength) {
                partialByteEnd = linkPropertiesEncrypted.OriginalLength - 1;
            }
        }
        let destStream;
        if (nativelyDecryptedStream) {
            destStream = nativelyDecryptedStream;
        }
        else {
            let rawDecryptStream;
            let ivBuffer;
            if (linkPropertiesEncrypted.CypherBlockIV) {
                ivBuffer = Buffer.from(linkPropertiesEncrypted.CypherBlockIV, "binary");
                const cypherRangeStream = new RangeStream_1.RangeStream(AES_BLOCK_SIZE, stream.length - 1, stream.length);
                stream.stream.pipe(cypherRangeStream);
                rawDecryptStream = cypherRangeStream;
            }
            else {
                try {
                    ivBuffer = yield readStream(stream.stream, AES_BLOCK_SIZE);
                }
                catch (err) {
                    debug(err);
                    return Promise.reject(err);
                }
                linkPropertiesEncrypted.CypherBlockIV = ivBuffer.toString("binary");
                stream.stream.resume();
                rawDecryptStream = stream.stream;
            }
            const decryptStream = crypto.createDecipheriv("aes-256-cbc", lcp.ContentKey, ivBuffer);
            decryptStream.setAutoPadding(false);
            rawDecryptStream.pipe(decryptStream);
            destStream = decryptStream;
            if (linkPropertiesEncrypted.CypherBlockPadding) {
                const cypherUnpaddedStream = new RangeStream_1.RangeStream(0, plainTextSize - 1, plainTextSize);
                destStream.pipe(cypherUnpaddedStream);
                destStream = cypherUnpaddedStream;
            }
        }
        if (linkPropertiesEncrypted.Compression === "deflate") {
            const inflateStream = zlib.createInflateRaw();
            destStream.pipe(inflateStream);
            destStream = inflateStream;
        }
        const l = linkPropertiesEncrypted.OriginalLength ?
            linkPropertiesEncrypted.OriginalLength : plainTextSize;
        if (isPartialByteRangeRequest) {
            const rangeStream = new RangeStream_1.RangeStream(partialByteBegin, partialByteEnd, l);
            destStream.pipe(rangeStream);
            destStream = rangeStream;
        }
        const sal = {
            length: l,
            reset: () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                let resetedStream;
                try {
                    resetedStream = yield stream.reset();
                }
                catch (err) {
                    debug(err);
                    return Promise.reject(err);
                }
                if (!resetedStream) {
                    return Promise.reject("??");
                }
                return transformStream(lcp, linkHref, linkPropertiesEncrypted, resetedStream, isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
            }),
            stream: destStream,
        };
        return Promise.resolve(sal);
    });
}
exports.transformStream = transformStream;
function getDecryptedSizeStream(lcp, stream) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const TWO_AES_BLOCK_SIZE = 2 * AES_BLOCK_SIZE;
            if (stream.length < TWO_AES_BLOCK_SIZE) {
                reject("crypto err");
                return;
            }
            const readPos = stream.length - TWO_AES_BLOCK_SIZE;
            const cypherRangeStream = new RangeStream_1.RangeStream(readPos, readPos + TWO_AES_BLOCK_SIZE - 1, stream.length);
            stream.stream.pipe(cypherRangeStream);
            const decrypteds = [];
            cypherRangeStream.on("readable", () => {
                const ivBuffer = cypherRangeStream.read(AES_BLOCK_SIZE);
                if (!ivBuffer) {
                    return;
                }
                const encrypted = cypherRangeStream.read(AES_BLOCK_SIZE);
                const decryptStream = crypto.createDecipheriv("aes-256-cbc", lcp.ContentKey, ivBuffer);
                decryptStream.setAutoPadding(false);
                const buff1 = decryptStream.update(encrypted);
                if (buff1) {
                    decrypteds.push(buff1);
                }
                const buff2 = decryptStream.final();
                if (buff2) {
                    decrypteds.push(buff2);
                }
            });
            cypherRangeStream.on("end", () => {
                const decrypted = Buffer.concat(decrypteds);
                const nPaddingBytes = decrypted[AES_BLOCK_SIZE - 1];
                const size = stream.length - AES_BLOCK_SIZE - nPaddingBytes;
                const res = {
                    length: size,
                    padding: nPaddingBytes,
                };
                resolve(res);
            });
            cypherRangeStream.on("error", () => {
                reject("DECRYPT err");
            });
        });
    });
}
exports.getDecryptedSizeStream = getDecryptedSizeStream;
//# sourceMappingURL=transformer-lcp.js.map