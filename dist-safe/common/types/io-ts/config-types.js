"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("io-ts");
const pipeable_1 = require("fp-ts/lib/pipeable");
const either = require("fp-ts/lib/Either");
const taskEither = require("fp-ts/lib/TaskEither");
const option = require("fp-ts/lib/Option");
const constants_1 = require("../../constants");
const array = require("fp-ts/lib/Array");
const error_coalesce_1 = require("../../../sync-logic/error-coalesce");
const traverse_package_tree_1 = require("../../../sync-logic/traverse-package-tree");
const semver = require("semver");
const custom_type_helpers_1 = require("./custom-type-helpers");
const convert_errors_1 = require("./convert-errors");
const exactly_1 = require("./exactly");
exports.SemanticVersion = custom_type_helpers_1.customType('SemanticVersion', (input) => typeof input === 'string' && semver.valid(input) === input);
exports.NodeDependency = custom_type_helpers_1.customType('TSMonorepoNodeDependency = string | [string, string]', (input) => typeof input === 'string' || (Array.isArray(input) && input.length === 2));
const NodeDependencies = t.array(exports.NodeDependency);
exports.CompletePackageJson = t.type({
    version: exports.SemanticVersion,
    dependencies: NodeDependencies,
    devDependencies: NodeDependencies,
    peerDependencies: NodeDependencies,
    optionalDependencies: NodeDependencies
});
exports.PartialPackageJson = t.partial(exports.CompletePackageJson.props, 'package.json');
exports.PartialTSConfigJson = t.partial({
    compilerOptions: t.any,
    include: t.array(t.string),
    exclude: t.array(t.string),
    files: t.array(t.string)
}, 'tsconfig.json');
const JsonConfigs = t.partial({
    "package.json": exports.PartialPackageJson,
    "tsconfig.json": exports.PartialTSConfigJson
}, 'Record<filename, JSON>');
const typeNameJunctionConfig = "JunctionConfig";
const typeNamePackageConfig = "PackageConfig";
exports.PackageConfig = exactly_1.exactly(t.intersection([
    t.type({
        extends: t.array(t.string)
    }),
    t.partial({
        files: exactly_1.exactly(t.partial({
            json: JsonConfigs
        })),
        skoville: t.intersection([
            t.type({
                autoRestart: t.boolean,
                hot: t.boolean,
                serverAt: t.string
            }),
            t.partial({
                entry: t.string
            })
        ])
    })
], typeNamePackageConfig));
exports.JunctionConfig = t.record(t.string, t.unknown, `${typeNameJunctionConfig}={[nameSegment: string]: ${typeNameJunctionConfig}|${typeNamePackageConfig}}`);
exports.TSMonorepoJson = exactly_1.exactly(t.intersection([
    t.type({
        version: exports.SemanticVersion,
        ttypescript: t.boolean,
        port: t.Int
    }),
    t.partial({
        templates: t.record(t.string, exports.PackageConfig),
        packages: t.UnknownRecord
    })
]));
const packageConfigExplanation = `To configure a package (rather than a junction), ensure the name segment ends with "${constants_1.PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX}"`;
exports.validatePackageConfig = (configPath) => (input) => pipeable_1.pipe(exports.PackageConfig.decode(input), either.mapLeft(convert_errors_1.convertErorrs(configPath)));
exports.validateJunctionConfig = (configPath) => (input) => pipeable_1.pipe(exports.JunctionConfig.decode(input), either.mapLeft(convert_errors_1.convertErorrs(configPath, configPath[0] === constants_1.PACKAGES_DIRECTORY_NAME && configPath.length > 2 ? packageConfigExplanation : undefined)));
function validateTSMonoRepoJsonShape(input) {
    return pipeable_1.pipe(
    // First validate shape of the json.
    exports.TSMonorepoJson.decode(input), either.mapLeft(convert_errors_1.convertErorrs([])), 
    // Second, traverse the packages, and validate the shape of each recursively.
    taskEither.fromEither, taskEither.chain(validInput => pipeable_1.pipe(option.fromNullable(validInput.packages), taskEither.fromOption(() => constants_1.SUCCESS), taskEither.fold(taskEither.right, packages => pipeable_1.pipe(Object.entries(packages), array.map(([scopeName, packageJunction]) => pipeable_1.pipe(packageJunction, exports.validateJunctionConfig([constants_1.PACKAGES_DIRECTORY_NAME, scopeName]), taskEither.fromEither, taskEither.chain(validPackageJunction => traverse_package_tree_1.traversePackageTree(validPackageJunction, traverse_package_tree_1.generateInitialContext(scopeName), () => taskEither.right(constants_1.SUCCESS), // The traverse is already validating.
    () => taskEither.right(constants_1.SUCCESS) // The traverse is already validating.
    )))), error_coalesce_1.taskEithercoalesceConfigErrors)), taskEither.map(() => validInput))));
}
exports.validateTSMonoRepoJsonShape = validateTSMonoRepoJsonShape;
//# sourceMappingURL=config-types.js.map