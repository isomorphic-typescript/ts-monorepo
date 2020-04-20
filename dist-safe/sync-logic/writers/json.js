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
const path = require("path");
const log_1 = require("../../logging/log");
const deep_object_compare_1 = require("../deep-object-compare");
const presence_assertions_1 = require("../../file-system/presence-assertions");
const object_1 = require("../../file-system/object");
const colorize_special_text_1 = require("../../colorize-special-text");
const TaskEither_1 = require("fp-ts/lib/TaskEither");
const Either_1 = require("fp-ts/lib/Either");
const pipeable_1 = require("fp-ts/lib/pipeable");
function writeJsonAndReportChanges(relativePath, outputObject) {
    const outputJSONString = JSON.stringify(outputObject, null, 2);
    const absolutePath = path.resolve(relativePath);
    return pipeable_1.pipe(presence_assertions_1.assertFileSystemObjectType(relativePath, [object_1.FileSystemObjectType.file, object_1.FileSystemObjectType.nothing]), TaskEither_1.chain(descriptor => () => __awaiter(this, void 0, void 0, function* () {
        if (descriptor.type === object_1.FileSystemObjectType.file) {
            // The json file already existed, so we will print a detailed explanation of changes to the file after writing it to disk,
            // to inform the end-user of all the changes made.
            const currentJSONString = (yield fs.promises.readFile(absolutePath)).toString();
            var parseFailed = false;
            var currentObject;
            try {
                currentObject = JSON.parse(currentJSONString);
            }
            catch (e) {
                parseFailed = true;
                log_1.log.error(`The current contents of '${colorize_special_text_1.colorize.file(relativePath)}' are not valid JSON.`);
                log_1.log.info(`Replacing current contents of '${colorize_special_text_1.colorize.file(relativePath)}' with the JSON\n${outputJSONString}`);
            }
            if (!parseFailed && currentObject !== undefined) {
                const differences = deep_object_compare_1.deepComparison(currentObject, outputObject, "");
                if (differences.length > 0) {
                    log_1.log.trace(`modifying file ${colorize_special_text_1.colorize.file(relativePath)}`);
                }
                differences.forEach(explanation => {
                    log_1.log.info(explanation);
                });
            }
        }
        else if (descriptor.type === object_1.FileSystemObjectType.nothing) {
            log_1.log.info(`creating file ${colorize_special_text_1.colorize.file(relativePath)}`);
        }
        try {
            yield fs.promises.writeFile(absolutePath, outputJSONString);
        }
        catch (e) {
            throw new Error(e);
        }
        return Either_1.right(outputJSONString);
    })));
}
exports.writeJsonAndReportChanges = writeJsonAndReportChanges;
//# sourceMappingURL=json.js.map