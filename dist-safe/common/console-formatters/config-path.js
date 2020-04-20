"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ansicolor = require("ansicolor");
function constructPresentableConfigObjectPath(configObjectPath) {
    return configObjectPath.map(key => `${ansicolor.lightYellow('[') + ansicolor.lightCyan(key) + ansicolor.lightYellow(']')}`).join("");
}
exports.constructPresentableConfigObjectPath = constructPresentableConfigObjectPath;
//# sourceMappingURL=config-path.js.map