"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const taskEither = require("fp-ts/lib/TaskEither"); // { TaskEither, chain, map, fromEither, fold, right }
const either = require("fp-ts/lib/Either");
const option = require("fp-ts/lib/Option");
const pipeable_1 = require("fp-ts/lib/pipeable");
const array = require("fp-ts/lib/Array");
const presence_assertions_1 = require("../file-system/presence-assertions");
const constants_1 = require("../common/constants");
const parse_json_1 = require("../file-system/parse-json");
const errors_1 = require("../common/errors");
const traverse_package_tree_1 = require("./traverse-package-tree");
const monorepo_package_registry_1 = require("../package-dependency-logic/monorepo-package-registry");
const validate_monorepo_config_1 = require("./input-validation/validate-monorepo-config");
const object_1 = require("../file-system/object");
const write_monorepo_package_files_1 = require("./converters/monorepo-to-output/write-monorepo-package-files");
const json_1 = require("./writers/json");
const ts_project_leaves_json_1 = require("./converters/monorepo-to-output/files/ts-project-leaves.json");
const cached_latest_version_fetcher_1 = require("./cached-latest-version-fetcher");
const error_coalesce_1 = require("./error-coalesce");
const config_types_1 = require("../common/types/io-ts/config-types");
const validate_no_unexpected_folders_1 = require("./validate-no-unexpected-folders");
const install_with_berry_1 = require("../package-dependency-logic/berry-install/install-with-berry");
const typescript_runner_1 = require("../process/typescript-runner");
const monorepo_package_json_1 = require("./converters/monorepo-to-output/files/monorepo-package.json");
function syncMonorepo() {
    const packageRegistry = new monorepo_package_registry_1.MonorepoPackageRegistry();
    const cachedLatestVersionFetcher = new cached_latest_version_fetcher_1.CachedLatestVersionFetcher();
    // TODO: pass comments down to generated jsons (for json which supports this)
    // TODO: get a source map from loaded json object path to location range in json file. This will allow for better error reporting and eventual VSCode plugin.
    return pipeable_1.pipe(
    // 1. Read in monorepo config
    presence_assertions_1.assertFileSystemObjectType(constants_1.CONFIG_FILE_RELATIVE_PATH, [object_1.FileSystemObjectType.file]), taskEither.chain(() => () => __awaiter(this, void 0, void 0, function* () { return either.right((yield fs.promises.readFile(constants_1.CONFIG_FILE_ABSOLUTE_PATH)).toString()); })), taskEither.chain(json => taskEither.fromEither(parse_json_1.parseJson(json))), // Switch to chainEither when 2.4 comes out
    taskEither.chain(config_types_1.validateTSMonoRepoJsonShape), taskEither.chain(monorepoConfig => pipeable_1.pipe(
    // 2. Validate config file
    validate_monorepo_config_1.validateMonorepoConfig(monorepoConfig, packageRegistry), taskEither.chain(() => {
        if (packageRegistry.getLeafSet().size === 0) {
            return taskEither.left([{
                    type: errors_1.ErrorType.NoLeafPackages,
                    message: "No leaf packages detected. There must be at least one."
                }]);
        }
        else {
            return taskEither.right(constants_1.SUCCESS);
        }
    }), 
    // 3. Write directories
    taskEither.chain(() => pipeable_1.pipe(option.fromNullable(monorepoConfig.packages), either.fromOption(() => constants_1.SUCCESS), taskEither.fromEither, taskEither.fold(taskEither.right, packages => pipeable_1.pipe(presence_assertions_1.assertDirectoryExistsOrCreate(constants_1.PACKAGES_DIRECTORY_RELATIVE_PATH), taskEither.chain(() => pipeable_1.pipe(Object.entries(packages), array.map(([scopeName, packagesUnderScope]) => traverse_package_tree_1.traversePackageTree(packagesUnderScope, traverse_package_tree_1.generateInitialContext(scopeName), (_config, context) => presence_assertions_1.assertDirectoryExistsOrCreate(context.relativePath), (_config, context) => presence_assertions_1.assertDirectoryExistsOrCreate(context.relativePath))), error_coalesce_1.taskEithercoalesceConfigErrors)))))), 
    // 4. Make sure no unexpected folders exist
    taskEither.chain(() => validate_no_unexpected_folders_1.validateNoUnexpectedFolders(monorepoConfig)), // TODO: add watchers so that if unexpected objects are removed, then sync is rerun.
    // 5. Write files.
    taskEither.chain(() => pipeable_1.pipe(Array.from(packageRegistry.getRegisteredPackages()), array.map(monorepoPackage => write_monorepo_package_files_1.writeMonorepoPackageFiles(monorepoPackage, packageRegistry, cachedLatestVersionFetcher)), error_coalesce_1.taskEithercoalesceConfigErrors)), taskEither.chain(() => pipeable_1.pipe(presence_assertions_1.assertDirectoryExistsOrCreate(constants_1.TS_MONOREPO_FOLDER_RELATIVE_PATH), taskEither.chain(() => json_1.writeJsonAndReportChanges(constants_1.TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH, ts_project_leaves_json_1.monorepoPackageRegistryToTSProjectLeavesJsonOutput(packageRegistry))), taskEither.chain(() => monorepo_package_json_1.monorepoPackageRegistryToMonorepoRootPackageJson(packageRegistry)), taskEither.chain(packageJsonObject => json_1.writeJsonAndReportChanges(constants_1.MONOREPO_PACKAGE_JSON_RELATIVE_PATH, packageJsonObject)))), 
    // 6. Install dependencies.
    taskEither.chain(install_with_berry_1.installViaBerry), 
    // 7. Set up watchers
    taskEither.map(() => {
        return typescript_runner_1.startTypeScript(monorepoConfig);
    }))));
    // TODO: clean before compile usage.
    // TODO: we would like to have a feature whereby the user may choose specific package implementations
    // to override. Otherwise, on every install step, we would be trashing any discrepancies between the
    // installed dependency and the version of that dependency saved to npm.. This may be unintended behavior
    // for the user since they may want to override implementations in order to experiment with changes.
}
exports.syncMonorepo = syncMonorepo;
//# sourceMappingURL=sync-monorepo.js.map