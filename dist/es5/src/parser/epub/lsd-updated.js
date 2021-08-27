"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Updated = void 0;
var tslib_1 = require("tslib");
var ta_json_x_1 = require("ta-json-x");
var Updated = (function () {
    function Updated() {
    }
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("license"),
        (0, tslib_1.__metadata)("design:type", Date)
    ], Updated.prototype, "License", void 0);
    (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonProperty)("status"),
        (0, tslib_1.__metadata)("design:type", Date)
    ], Updated.prototype, "Status", void 0);
    Updated = (0, tslib_1.__decorate)([
        (0, ta_json_x_1.JsonObject)()
    ], Updated);
    return Updated;
}());
exports.Updated = Updated;
//# sourceMappingURL=lsd-updated.js.map