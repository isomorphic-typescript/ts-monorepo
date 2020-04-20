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
var FileSystemObjectType;
(function (FileSystemObjectType) {
    FileSystemObjectType["nothing"] = "nothing";
    FileSystemObjectType["file"] = "file";
    FileSystemObjectType["directory"] = "directory";
    FileSystemObjectType["symlink"] = "symlink";
})(FileSystemObjectType = exports.FileSystemObjectType || (exports.FileSystemObjectType = {}));
function getFileSystemObjectDescriptor(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = yield (function () {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield fs.promises.lstat(path);
                }
                catch (e) {
                    return undefined;
                }
            });
        })();
        if (stats === undefined) {
            return {
                path,
                type: FileSystemObjectType.nothing
            };
        }
        else {
            if (stats.isSymbolicLink()) {
                const destination = yield getFileSystemObjectDescriptor(yield fs.promises.readlink(path));
                return {
                    path,
                    type: FileSystemObjectType.symlink,
                    destination,
                    traversedPath: destination.type === FileSystemObjectType.symlink ? destination.traversedPath : destination.path,
                    traversedType: destination.type === FileSystemObjectType.symlink ? destination.traversedType : destination.type
                };
            }
            else {
                return {
                    path,
                    type: stats.isDirectory() ? FileSystemObjectType.directory : FileSystemObjectType.file
                };
            }
        }
    });
}
exports.getFileSystemObjectDescriptor = getFileSystemObjectDescriptor;
//# sourceMappingURL=object.js.map