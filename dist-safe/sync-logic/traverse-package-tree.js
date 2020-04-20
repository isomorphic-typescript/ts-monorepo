"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const constants_1 = require("../common/constants");
const taskEither = require("fp-ts/lib/TaskEither");
const array = require("fp-ts/lib/Array");
const pipeable_1 = require("fp-ts/lib/pipeable");
const error_coalesce_1 = require("./error-coalesce");
const config_types_1 = require("../common/types/io-ts/config-types");
const lowercaseAlphanumeric = /[a-z0-9]/;
function removeLeadingPunctuation(packageNameSegment) {
    for (var currentIndex = 0; currentIndex < packageNameSegment.length; ++currentIndex) {
        if (packageNameSegment[currentIndex].match(lowercaseAlphanumeric)) {
            return packageNameSegment.slice(currentIndex);
        }
    }
    return "";
}
exports.nameSegmentToSubFolderName = removeLeadingPunctuation;
function generateInitialContext(scope) {
    const scopePackageNameSegment = scope === constants_1.GLOBAL_SCOPE_NAME ? "" : `${scope}/`;
    const initialContext = {
        packageNamePrefix: scopePackageNameSegment,
        relativePath: path.join(constants_1.PACKAGES_DIRECTORY_RELATIVE_PATH, scope),
        configObjectPath: [constants_1.PACKAGES_DIRECTORY_NAME, scope],
        pathSegment: scope,
        packageNameSegment: scopePackageNameSegment
    };
    return initialContext;
}
exports.generateInitialContext = generateInitialContext;
function resolvePackageNameFromContext(context) {
    return context.packageNamePrefix.substring(0, context.packageNamePrefix.length - constants_1.PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX.length);
}
function traversePackageTree(config, context, packageHandler, junctionHandler) {
    const isPackageConfig = context.packageNamePrefix.endsWith(constants_1.PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX);
    if (isPackageConfig) {
        return pipeable_1.pipe(config_types_1.validatePackageConfig(context.configObjectPath)(config), taskEither.fromEither, taskEither.chain(packageConfig => packageHandler(packageConfig, context, resolvePackageNameFromContext(context))));
    }
    else {
        return pipeable_1.pipe(config_types_1.validateJunctionConfig(context.configObjectPath)(config), taskEither.fromEither, taskEither.chain(junctionConfig => {
            const childContexts = pipeable_1.pipe(Object.keys(junctionConfig), array.map(nameSegment => {
                const pathSegment = exports.nameSegmentToSubFolderName(nameSegment);
                return [
                    nameSegment,
                    {
                        packageNamePrefix: `${context.packageNamePrefix}${nameSegment}`,
                        relativePath: path.join(context.relativePath, pathSegment),
                        configObjectPath: [...context.configObjectPath, nameSegment],
                        pathSegment,
                        packageNameSegment: nameSegment
                    }
                ];
            }), Object.fromEntries);
            return pipeable_1.pipe(junctionHandler(junctionConfig, context, childContexts), taskEither.chain(() => pipeable_1.pipe(Object.entries(junctionConfig), array.map(([nameSegment, childConfig]) => traversePackageTree(childConfig, childContexts[nameSegment], packageHandler, junctionHandler)), error_coalesce_1.taskEithercoalesceConfigErrors)));
        }));
    }
}
exports.traversePackageTree = traversePackageTree;
//# sourceMappingURL=traverse-package-tree.js.map