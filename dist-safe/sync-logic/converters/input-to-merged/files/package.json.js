"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertToMergedPackageJSON(name, inputPackageJSON) {
    var _a, _b, _c, _d;
    return Object.assign(Object.assign({}, inputPackageJSON), { // Their own input.
        name, dependencies: (_a = inputPackageJSON === null || inputPackageJSON === void 0 ? void 0 : inputPackageJSON.dependencies) !== null && _a !== void 0 ? _a : [], devDependencies: (_b = inputPackageJSON === null || inputPackageJSON === void 0 ? void 0 : inputPackageJSON.devDependencies) !== null && _b !== void 0 ? _b : [], peerDependencies: (_c = inputPackageJSON === null || inputPackageJSON === void 0 ? void 0 : inputPackageJSON.peerDependencies) !== null && _c !== void 0 ? _c : [], optionalDependencies: (_d = inputPackageJSON === null || inputPackageJSON === void 0 ? void 0 : inputPackageJSON.optionalDependencies) !== null && _d !== void 0 ? _d : [] });
}
exports.convertToMergedPackageJSON = convertToMergedPackageJSON;
//# sourceMappingURL=package.json.js.map