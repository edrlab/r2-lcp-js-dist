"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ta_json_x_1 = require("ta-json-x");
let LsdEvent = class LsdEvent {
};
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("type"),
    tslib_1.__metadata("design:type", String)
], LsdEvent.prototype, "Type", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("name"),
    tslib_1.__metadata("design:type", String)
], LsdEvent.prototype, "Name", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("id"),
    tslib_1.__metadata("design:type", String)
], LsdEvent.prototype, "ID", void 0);
tslib_1.__decorate([
    ta_json_x_1.JsonProperty("timestamp"),
    tslib_1.__metadata("design:type", Date)
], LsdEvent.prototype, "TimeStamp", void 0);
LsdEvent = tslib_1.__decorate([
    ta_json_x_1.JsonObject()
], LsdEvent);
exports.LsdEvent = LsdEvent;
//# sourceMappingURL=lsd-event.js.map