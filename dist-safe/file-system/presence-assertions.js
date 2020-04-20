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
const object_1 = require("./object");
const fs = require("fs");
const errors_1 = require("../common/errors");
const colorize_special_text_1 = require("../colorize-special-text");
const Either_1 = require("fp-ts/lib/Either");
const constants_1 = require("../common/constants");
function assertFileSystemObjectType(pathRelativeToProjectRoot, isOneOf) {
    return () => __awaiter(this, void 0, void 0, function* () {
        const descriptor = yield object_1.getFileSystemObjectDescriptor(path.resolve(pathRelativeToProjectRoot));
        if (!isOneOf.includes(descriptor.type)) {
            return Either_1.left([{
                    type: errors_1.ErrorType.FileSystemObjectNotFound,
                    message: `Expected a ${isOneOf.join(' or ')} at ${colorize_special_text_1.colorize.file(pathRelativeToProjectRoot)}. Found ${descriptor.type} instead.`
                }]);
        }
        return Either_1.right(descriptor);
    });
}
exports.assertFileSystemObjectType = assertFileSystemObjectType;
function assertDirectoryExistsOrCreate(directoryPathRelativeToProjectRoot) {
    return () => __awaiter(this, void 0, void 0, function* () {
        const absolutePath = path.resolve(directoryPathRelativeToProjectRoot);
        const descriptor = yield object_1.getFileSystemObjectDescriptor(absolutePath);
        if (descriptor.type === object_1.FileSystemObjectType.nothing) {
            yield fs.promises.mkdir(absolutePath);
        }
        else if (descriptor.type !== object_1.FileSystemObjectType.directory) {
            return Either_1.left([
                {
                    type: errors_1.ErrorType.FileSystemObjectNotFound,
                    message: `Expected ${object_1.FileSystemObjectType.directory} at ${colorize_special_text_1.colorize.directory(directoryPathRelativeToProjectRoot)}. Found ${descriptor.type} instead.`
                }
            ]);
        }
        return Either_1.right(constants_1.SUCCESS);
    });
}
exports.assertDirectoryExistsOrCreate = assertDirectoryExistsOrCreate;
//# sourceMappingURL=presence-assertions.js.map