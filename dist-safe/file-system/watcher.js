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
const chokidar = require("chokidar");
const object_1 = require("./object");
function watch(path, handlers) {
    return __awaiter(this, void 0, void 0, function* () {
        const watcher = chokidar.watch(path, { followSymlinks: false });
        if (handlers.onExists) {
            const onExists = handlers.onExists;
            watcher
                .on("add", (path, _stats) => __awaiter(this, void 0, void 0, function* () {
                return onExists(yield object_1.getFileSystemObjectDescriptor(path));
            }))
                .on("addDir", (path, _stats) => __awaiter(this, void 0, void 0, function* () {
                return onExists(yield object_1.getFileSystemObjectDescriptor(path));
            }));
        }
        if (handlers.onChange) {
            const onChange = handlers.onChange;
            watcher
                .on("change", (path, _stats) => __awaiter(this, void 0, void 0, function* () {
                return onChange(yield object_1.getFileSystemObjectDescriptor(path));
            }));
        }
        if (handlers.onRemove) {
            const onRemove = handlers.onRemove;
            watcher
                .on("unlink", (path) => __awaiter(this, void 0, void 0, function* () {
                onRemove(path, false);
            }))
                .on("unlinkDir", (path) => __awaiter(this, void 0, void 0, function* () {
                onRemove(path, true);
            }));
        }
        watcher.on("error", error => {
            throw error;
        });
        return new Promise(resolve => {
            watcher.on("ready", () => {
                resolve({
                    terminate: () => watcher.close()
                });
            });
        });
    });
}
exports.watch = watch;
//# sourceMappingURL=watcher.js.map