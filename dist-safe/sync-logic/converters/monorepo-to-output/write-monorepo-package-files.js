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
const path = require("path");
const json_1 = require("../../writers/json");
const package_json_1 = require("./files/package.json");
const tsconfig_json_1 = require("./files/tsconfig.json");
const presence_assertions_1 = require("../../../file-system/presence-assertions");
const constants_1 = require("../../../common/constants");
const fs = require("fs");
const taskEither = require("fp-ts/lib/TaskEither");
const Either_1 = require("fp-ts/lib/Either");
const pipeable_1 = require("fp-ts/lib/pipeable");
const array = require("fp-ts/lib/Array");
const error_coalesce_1 = require("../../error-coalesce");
function writeMonorepoPackageFiles(monorepoPackage, monorepoPackageRegistry, latestVersionGetter) {
    return pipeable_1.pipe([
        presence_assertions_1.assertDirectoryExistsOrCreate(path.join(monorepoPackage.relativePath, constants_1.TS_CONFIG_JSON_OUT_DIR)),
        presence_assertions_1.assertDirectoryExistsOrCreate(path.join(monorepoPackage.relativePath, constants_1.TS_CONFIG_JSON_ROOT_DIR))
    ], error_coalesce_1.taskEithercoalesceConfigErrors, taskEither.chain(() => pipeable_1.pipe(Object.entries(monorepoPackage.config.files.json), // TODO: support other file types.
    array.map(([jsonFilename, jsonObject]) => {
        // Write templated config files
        const pathToFile = path.join(monorepoPackage.relativePath, jsonFilename);
        const outputObjectTaskEither = jsonFilename === constants_1.PACKAGE_JSON_FILENAME ? package_json_1.monorepoPackageToPackageJsonOutput(monorepoPackage, monorepoPackageRegistry, latestVersionGetter) :
            jsonFilename === constants_1.TS_CONFIG_JSON_FILENAME ? taskEither.right(tsconfig_json_1.monorepoPakcageToTSConfigJsonOutput(monorepoPackage)) :
                taskEither.right(jsonObject);
        return pipeable_1.pipe(outputObjectTaskEither, taskEither.chain(outputObject => json_1.writeJsonAndReportChanges(pathToFile, outputObject)), taskEither.chain(outputJsonString => () => __awaiter(this, void 0, void 0, function* () {
            // By default we copy package.json over to the build folder, for other files, the user will need to explicitly set this in the config.
            if (jsonFilename === constants_1.PACKAGE_JSON_FILENAME) {
                yield fs.promises.writeFile(path.resolve(monorepoPackage.relativePath, constants_1.TS_CONFIG_JSON_OUT_DIR, constants_1.PACKAGE_JSON_FILENAME), outputJsonString);
            }
            return Either_1.right(constants_1.SUCCESS);
        })));
    }), error_coalesce_1.taskEithercoalesceConfigErrors)));
}
exports.writeMonorepoPackageFiles = writeMonorepoPackageFiles;
//# sourceMappingURL=write-monorepo-package-files.js.map