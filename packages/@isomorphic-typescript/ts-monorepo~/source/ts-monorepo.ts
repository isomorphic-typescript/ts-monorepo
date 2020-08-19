import "source-map-support/register";
import { log } from './logging/log';
import { restartProgram } from './process/restart-program';
import { syncMonorepo } from './sync-logic/sync-monorepo';
import { watch } from "./file-system/watcher";
import { CONFIG_FILE_NAME, CONFIG_FILE_ABSOLUTE_PATH, TOOL_SHORT_NAME, TOOL_VERSION } from './common/constants';
import { colorize } from "./colorize-special-text";
import { Terminateable } from "./common/types/traits";
import { tryCatch } from 'fp-ts/lib/TaskEither';
import { flatten, fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option';
import { ErrorType, ConfigError } from "./common/errors";
import { detectProgramChanges, initialize } from "./self-change-detector";

const CONFIG_ERROR_LOGGING_ENABLED = true;

const watchers: Terminateable[] = [];
async function main() {
    log.info(`pid = ${process.pid}`);
    log.info(`${colorize.package(TOOL_SHORT_NAME)} v${TOOL_VERSION}`);

    var updateQueued = false; // This ensures that only one sync monorepo operation is occurring at a time.
    var currentSyncTask = initialize(); // Could even be plain Promise.resolve(); doesn't matter really. Just needs to be a promise.
    var maybeActiveBuildTask: Option<Terminateable> = none;
    function queueMonorepoSync() {
        if (updateQueued) return;
        updateQueued = true;
        currentSyncTask = currentSyncTask.then(async () => {
            updateQueued = false;
            if(isSome(maybeActiveBuildTask)) await maybeActiveBuildTask.value.terminate();
            log.info(`Parsing ${colorize.file(CONFIG_FILE_NAME)}`);
            maybeActiveBuildTask = pipe(
                await tryCatch(
                    syncMonorepo(),
                    (e: any) => [{
                        type: ErrorType.UnexpectedRuntimeError,
                        message: `${e.stack || e.message}`
                    } as ConfigError]
                )(),
                flatten,
                thing => {
                    return thing;
                },
                fold(
                    configErrors => {
                        if (CONFIG_ERROR_LOGGING_ENABLED) {
                            log.error(`${configErrors.length} errors:\n\n${
                                configErrors.map(
                                    (configError, index) => `${(index + 1)}. ${colorize.error(configError.type)}\n${configError.message}`
                                ).join("\n\n")
                            }\n`);
                        }
                        log.info("Waiting for changes...");
                        return none;
                    },
                    some
                )
            );
        });
    }

    watchers.push(await watch(CONFIG_FILE_ABSOLUTE_PATH, {
        onChange: queueMonorepoSync,
        onRemove() {
            log.warn(`${colorize.file(CONFIG_FILE_NAME)} deleted. Re-add it to resume watching.`);
        }
    }));


    function reportChanges(pastTenseVerb: string, files: string[]) {
        if (files.length === 0) return;
        log.info(`The following ${files.length} in-program file(s) were ${pastTenseVerb}:`);
        const leftPad = (files.length + "").length;
        files.forEach((file, index) => {
            log.info(` ${((index + 1) + "").padStart(leftPad, ' ')}. ${colorize.file(file)}`);
        });
    }

    watchers.push(await watch(__filename, {
        async onChange() {
            const maybeChanges = await detectProgramChanges();
            if (isNone(maybeChanges)) {
                log.info("Waiting for changes...");
                return;
            }
            const changes = maybeChanges.value;
            if (isSome(maybeActiveBuildTask)) await maybeActiveBuildTask.value.terminate();
            restartProgram(async () => {
                log.info("Detected change in program itself.");
                reportChanges('added', changes.filesAdded);
                reportChanges('removed', changes.filesRemoved);
                reportChanges('modified', changes.filesChanged);
                reportChanges('resigned', changes.filesWithSignatureChanges);
                log.info("Terminating watchers.");
                await Promise.all(watchers.map(watcher => watcher.terminate()));
            });
        }
    }));

    queueMonorepoSync();
}

main().catch(e => {
    log.info("Program crashed.");
    console.log(e.message || e.stack);
});

export = {
    name: TOOL_SHORT_NAME,
    factory: (require: any) => {
        const { Command } = require('clipanion');
        class ToolCommand extends Command {
            async execute() {
                try {
                    await main();
                } catch(e) {
                    restartProgram(async () => {
                        log.info("Program crashed.");
                        console.log(e.message || e.stack);
                    });
                }
            }
        }
        ToolCommand.addPath(TOOL_SHORT_NAME);
        return {
            commands: [ ToolCommand as any ]
        };
    }
}