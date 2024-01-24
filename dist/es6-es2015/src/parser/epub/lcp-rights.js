"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rights = void 0;
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let Rights = class Rights {
};
exports.Rights = Rights;
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("print"),
    tslib_1.__metadata("design:type", Number)
], Rights.prototype, "Print", void 0);
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("copy"),
    tslib_1.__metadata("design:type", Number)
], Rights.prototype, "Copy", void 0);
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("start"),
    tslib_1.__metadata("design:type", Date)
], Rights.prototype, "Start", void 0);
tslib_1.__decorate([
    (0, ta_json_x_1.JsonProperty)("end"),
    tslib_1.__metadata("design:type", Date)
], Rights.prototype, "End", void 0);
exports.Rights = Rights = tslib_1.__decorate([
    (0, ta_json_x_1.JsonObject)()
], Rights);
//# sourceMappingURL=lcp-rights.js.map