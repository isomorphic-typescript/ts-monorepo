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
const taskEither = require("fp-ts/lib/TaskEither");
const either = require("fp-ts/lib/Either");
const pipeable_1 = require("fp-ts/lib/pipeable");
const presence_assertions_1 = require("../../../../file-system/presence-assertions");
const constants_1 = require("../../../../common/constants");
const object_1 = require("../../../../file-system/object");
const fs = require("fs");
function monorepoPackageRegistryToMonorepoRootPackageJson(monorepoPackageRegistry) {
    return pipeable_1.pipe(presence_assertions_1.assertFileSystemObjectType(constants_1.MONOREPO_PACKAGE_JSON_RELATIVE_PATH, [object_1.FileSystemObjectType.file, object_1.FileSystemObjectType.nothing]), taskEither.chain(descriptor => () => __awaiter(this, void 0, void 0, function* () {
        const valuesToOverwrite = {
            private: true,
            workspaces: Array.from(monorepoPackageRegistry.getRegisteredPackages().values()).map(registeredPackage => {
                return registeredPackage.relativePath;
            })
        };
        if (descriptor.type === object_1.FileSystemObjectType.file) {
            const existingFileContents = (yield (fs.promises.readFile(constants_1.MONOREPO_PACKAGE_JSON_ABSOLUTE_PATH))).toString();
            var existingFileJSON;
            try {
                existingFileJSON = JSON.parse(existingFileContents);
            }
            catch (e) {
                return either.right(valuesToOverwrite);
            }
            Object.keys(valuesToOverwrite).forEach(key => {
                existingFileJSON[key] = valuesToOverwrite[key];
            });
            return either.right(existingFileJSON);
        }
        else {
            return either.right(valuesToOverwrite);
        }
    })));
}
exports.monorepoPackageRegistryToMonorepoRootPackageJson = monorepoPackageRegistryToMonorepoRootPackageJson;
//# sourceMappingURL=monorepo-package.json.js.map