"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const constants_1 = require("../../../../common/constants");
// TODO: how can we handle circular references? Should we before the following is solved? https://github.com/microsoft/TypeScript/issues/33685
function monorepoPackageRegistryToTSProjectLeavesJsonOutput(monorepoPackageRegistry) {
    return {
        files: [],
        references: Array.from(monorepoPackageRegistry.getLeafSet())
            .map(monorepoPackage => ({
            path: path.relative(path.resolve(constants_1.TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_ABSOLUTE_PATH, '../'), path.resolve(monorepoPackage.relativePath))
        }))
    };
}
exports.monorepoPackageRegistryToTSProjectLeavesJsonOutput = monorepoPackageRegistryToTSProjectLeavesJsonOutput;
//# sourceMappingURL=ts-project-leaves.json.js.map