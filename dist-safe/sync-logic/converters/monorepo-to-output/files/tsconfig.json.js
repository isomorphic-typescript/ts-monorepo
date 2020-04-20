"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const deepmerge = require("deepmerge");
const constants_1 = require("../../../../common/constants");
function monorepoPakcageToTSConfigJsonOutput(monorepoPackage) {
    return deepmerge((monorepoPackage.config.files.json)[constants_1.TS_CONFIG_JSON_FILENAME], {
        include: [
            `${constants_1.TS_CONFIG_JSON_ROOT_DIR}/**/*`
        ],
        references: Object.values(monorepoPackage.relationships.dependsOn)
            .map(dependencyMonorepoPackage => {
            // Calculate relative path to dependency from relative path of current.
            return {
                path: path.relative(path.resolve(monorepoPackage.relativePath), path.resolve(dependencyMonorepoPackage.relativePath))
            };
        })
    });
}
exports.monorepoPakcageToTSConfigJsonOutput = monorepoPakcageToTSConfigJsonOutput;
//# sourceMappingURL=tsconfig.json.js.map