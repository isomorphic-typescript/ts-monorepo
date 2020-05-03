"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
function md5Hash(input) {
    return crypto.createHash("md5").update(input).digest("hex");
}
exports.md5Hash = md5Hash;
//# sourceMappingURL=util.js.map