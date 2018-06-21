"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const zlib = require("zlib");
const RangeStream_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/RangeStream");
const debug_ = require("debug");
const BufferUtils_1 = require("r2-utils-js/dist/es8-es2017/src/_utils/stream/BufferUtils");
const debug = debug_("r2:lcp#transform/transformer-lcp");
const AES_BLOCK_SIZE = 16;
const readStream = async (s, n) => {
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
};
function supports(lcp, _linkHref, linkPropertiesEncrypted) {
    if (!lcp) {
        return false;
    }
    if (!lcp.isReady()) {
        debug("LCP not ready!");
        return false;
    }
    const check = linkPropertiesEncrypted.Scheme === "http://readium.org/2014/01/lcp"
        && (linkPropertiesEncrypted.Profile === "http://readium.org/lcp/basic-profile" ||
            linkPropertiesEncrypted.Profile === "http://readium.org/lcp/profile-1.0")
        && linkPropertiesEncrypted.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc";
    if (!check) {
        debug("Incorrect resource LCP fields.");
        debug(linkPropertiesEncrypted.Scheme);
        debug(linkPropertiesEncrypted.Profile);
        debug(linkPropertiesEncrypted.Algorithm);
        return false;
    }
    return true;
}
exports.supports = supports;
async function transformStream(lcp, linkHref, linkPropertiesEncrypted, stream, isPartialByteRangeRequest, partialByteBegin, partialByteEnd) {
    const isCompressionNone = linkPropertiesEncrypted.Compression === "none";
    const isCompressionDeflate = linkPropertiesEncrypted.Compression === "deflate";
    let plainTextSize = -1;
    let nativelyDecryptedStream;
    let nativelyInflated = false;
    if (lcp.isNativeNodePlugin()) {
        debug("DECRYPT: " + linkHref);
        let fullEncryptedBuffer;
        try {
            fullEncryptedBuffer = await BufferUtils_1.streamToBufferPromise(stream.stream);
        }
        catch (err) {
            debug(err);
            return Promise.reject("OUCH!");
        }
        let res;
        try {
            res = await lcp.decrypt(fullEncryptedBuffer, linkHref, isCompressionDeflate);
        }
        catch (err) {
            debug(err);
            return Promise.reject("OUCH!");
        }
        const nativelyDecryptedBuffer = res.buffer;
        nativelyInflated = res.inflated;
        plainTextSize = nativelyDecryptedBuffer.length;
        linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;
        if (!nativelyInflated &&
            linkPropertiesEncrypted.OriginalLength &&
            isCompressionNone &&
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
                cryptoInfo = await getDecryptedSizeStream(lcp, stream);
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
                stream = await stream.reset();
            }
            catch (err) {
                debug(err);
                return Promise.reject(err);
            }
            if (linkPropertiesEncrypted.OriginalLength &&
                isCompressionNone &&
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
                ivBuffer = await readStream(stream.stream, AES_BLOCK_SIZE);
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
    if (!nativelyInflated && isCompressionDeflate) {
        const inflateStream = zlib.createInflateRaw();
        destStream.pipe(inflateStream);
        destStream = inflateStream;
    }
    const l = (!nativelyInflated && linkPropertiesEncrypted.OriginalLength) ?
        linkPropertiesEncrypted.OriginalLength : plainTextSize;
    if (isPartialByteRangeRequest) {
        const rangeStream = new RangeStream_1.RangeStream(partialByteBegin, partialByteEnd, l);
        destStream.pipe(rangeStream);
        destStream = rangeStream;
    }
    const sal = {
        length: l,
        reset: async () => {
            let resetedStream;
            try {
                resetedStream = await stream.reset();
            }
            catch (err) {
                debug(err);
                return Promise.reject(err);
            }
            return transformStream(lcp, linkHref, linkPropertiesEncrypted, resetedStream, isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
        },
        stream: destStream,
    };
    return Promise.resolve(sal);
}
exports.transformStream = transformStream;
async function getDecryptedSizeStream(lcp, stream) {
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
}
exports.getDecryptedSizeStream = getDecryptedSizeStream;
//# sourceMappingURL=transformer-lcp.js.map