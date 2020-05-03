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
require("source-map-support/register");
const log_1 = require("./logging/log");
const restart_program_1 = require("./process/restart-program");
const sync_monorepo_1 = require("./sync-logic/sync-monorepo");
const watcher_1 = require("./file-system/watcher");
const constants_1 = require("./common/constants");
const colorize_special_text_1 = require("./colorize-special-text");
const TaskEither_1 = require("fp-ts/lib/TaskEither");
const Either_1 = require("fp-ts/lib/Either");
const pipeable_1 = require("fp-ts/lib/pipeable");
const Option_1 = require("fp-ts/lib/Option");
const errors_1 = require("./common/errors");
const self_change_detector_1 = require("./self-change-detector");
const watchers = [];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("");
        log_1.log.info(`pid = ${process.pid}`);
        log_1.log.info(`${colorize_special_text_1.colorize.package(constants_1.TOOL_SHORT_NAME)} v${constants_1.TOOL_VERSION}`);
        var updateQueued = false; // This ensures that only one sync monorepo operation is occurring at a time.
        var currentSyncTask = Promise.resolve();
        var maybeActiveBuildTask = Option_1.none;
        function queueMonorepoSync() {
            if (updateQueued)
                return;
            updateQueued = true;
            currentSyncTask = currentSyncTask.then(() => __awaiter(this, void 0, void 0, function* () {
                updateQueued = false;
                if (Option_1.isSome(maybeActiveBuildTask))
                    yield maybeActiveBuildTask.value.terminate();
                log_1.log.info(`Parsing ${colorize_special_text_1.colorize.file(constants_1.CONFIG_FILE_NAME)}`);
                maybeActiveBuildTask = pipeable_1.pipe(yield TaskEither_1.tryCatch(sync_monorepo_1.syncMonorepo(), (e) => [{
                        type: errors_1.ErrorType.UnexpectedRuntimeError,
                        message: `${e.stack || e.message}`
                    }])(), Either_1.flatten, Either_1.fold(configErrors => {
                    log_1.log.error(`${configErrors.length} errors:\n\n${configErrors.map((configError, index) => `${(index + 1)}. ${colorize_special_text_1.colorize.error(configError.type)}\n${configError.message}`).join("\n\n")}\n`);
                    log_1.log.info("Waiting for changes...");
                    return Option_1.none;
                }, Option_1.some));
            }));
        }
        watchers.push(yield watcher_1.watch(constants_1.CONFIG_FILE_ABSOLUTE_PATH, {
            onChange: queueMonorepoSync,
            onRemove() {
                log_1.log.warn(`${colorize_special_text_1.colorize.file(constants_1.CONFIG_FILE_NAME)} deleted. Re-add it to resume watching.`);
            }
        }));
        function reportChanges(pastTenseVerb, files) {
            if (files.length === 0)
                return;
            log_1.log.info(`The following ${files.length} in-program file(s) were ${pastTenseVerb}:`);
            const leftPad = (files.length + "").length;
            files.forEach((file, index) => {
                log_1.log.info(` ${((index + 1) + "").padStart(leftPad, ' ')}. ${colorize_special_text_1.colorize.file(file)}`);
            });
        }
        watchers.push(yield watcher_1.watch(__filename, {
            onChange() {
                return __awaiter(this, void 0, void 0, function* () {
                    const changes = yield self_change_detector_1.detectProgramChanges();
                    if (changes === undefined)
                        return;
                    if (Option_1.isSome(maybeActiveBuildTask))
                        yield maybeActiveBuildTask.value.terminate();
                    restart_program_1.restartProgram(() => __awaiter(this, void 0, void 0, function* () {
                        log_1.log.info("Detected change in program itself.");
                        reportChanges('added', changes.filesAdded);
                        reportChanges('removed', changes.filesRemoved);
                        reportChanges('modified', changes.filesChanged);
                        reportChanges('resigned', changes.filesWithSignatureChanges);
                        log_1.log.info("Terminating watchers.");
                        yield Promise.all(watchers.map(watcher => watcher.terminate()));
                    }));
                });
            }
        }));
        queueMonorepoSync();
    });
}
main().catch(e => {
    log_1.log.info("Program crashed.");
    console.log(e.message || e.stack);
});
module.exports = {
    name: constants_1.TOOL_SHORT_NAME,
    factory: (require) => {
        const { Command } = require('clipanion');
        class ToolCommand extends Command {
            execute() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield main();
                    }
                    catch (e) {
                        restart_program_1.restartProgram(() => __awaiter(this, void 0, void 0, function* () {
                            log_1.log.info("Program crashed.");
                            console.log(e.message || e.stack);
                        }));
                    }
                });
            }
        }
        ToolCommand.addPath(constants_1.TOOL_SHORT_NAME);
        return {
            commands: [ToolCommand]
        };
    }
};
//# sourceMappingURL=ts-monorepo.js.map