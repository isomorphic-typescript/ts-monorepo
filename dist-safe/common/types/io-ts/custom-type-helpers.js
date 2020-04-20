"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("io-ts");
function customType(name, is) {
    return new t.Type(name, is, function (input, context) {
        if (is(input)) {
            return t.success(input);
        }
        else {
            return t.failure(input, context);
        }
    }, validated => String(validated));
}
exports.customType = customType;
//# sourceMappingURL=custom-type-helpers.js.map