"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyToPreserveUnknownJSON = void 0;
exports.TaJsonDeserialize = TaJsonDeserialize;
exports.TaJsonSerialize = TaJsonSerialize;
const ta_json_x_1 = require("ta-json-x");
exports.KeyToPreserveUnknownJSON = "AdditionalJSON";
function TaJsonDeserialize(json, type) {
    return ta_json_x_1.JSON.deserialize(json, type, { keyToPreserveUnknownJSON: exports.KeyToPreserveUnknownJSON });
}
function TaJsonSerialize(obj) {
    return ta_json_x_1.JSON.serialize(obj, { keyToPreserveUnknownJSON: exports.KeyToPreserveUnknownJSON });
}
//# sourceMappingURL=serializable.js.map