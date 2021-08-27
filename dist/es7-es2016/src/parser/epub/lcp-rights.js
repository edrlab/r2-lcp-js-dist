"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rights = void 0;
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let Rights = class Rights {
};
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("print"),
    (0, tslib_1.__metadata)("design:type", Number)
], Rights.prototype, "Print", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("copy"),
    (0, tslib_1.__metadata)("design:type", Number)
], Rights.prototype, "Copy", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("start"),
    (0, tslib_1.__metadata)("design:type", Date)
], Rights.prototype, "Start", void 0);
(0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonProperty)("end"),
    (0, tslib_1.__metadata)("design:type", Date)
], Rights.prototype, "End", void 0);
Rights = (0, tslib_1.__decorate)([
    (0, ta_json_x_1.JsonObject)()
], Rights);
exports.Rights = Rights;
//# sourceMappingURL=lcp-rights.js.map