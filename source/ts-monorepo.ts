#!/usr/bin/env node
import "source-map-support/register";
import { log } from './util/log';
import { restartProgram } from './util/restart-program';
import { syncMonorepo } from './sync-logic/sync-monorepo';
import { CommandRunner } from './util/command-runner';
import { watch } from "./file-system/watcher";
import { TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH, CONFIG_FILE_NAME, CONFIG_FILE_ABSOLUTE_PATH } from './common-values';
import { colorize } from "./colorize-special-text";

function generateTSBuildCommand(ttypescipt: boolean) {
    return `npx ${ttypescipt ? "t" : ""}tsc -b --watch --preserveWatchOutput ${TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_RELATIVE_PATH}`;
}

async function main() {
    console.log("");
    log.info(`PID = ${process.pid}`);

    var updateQueued = false;
    var currentSyncTask = Promise.resolve();
    var activeBuildTask: CommandRunner | undefined;
    function queueMonorepoSync() {
        if (updateQueued) return;
        updateQueued = true;
        currentSyncTask = currentSyncTask.then(async () => {
            updateQueued = false;
            if(activeBuildTask) await activeBuildTask.kill();
            log.info(`Parsing ${colorize.file(CONFIG_FILE_NAME)}`);
            try {
                const useTTypescript = await syncMonorepo();
                activeBuildTask = new CommandRunner(generateTSBuildCommand(useTTypescript));
            } catch(e) {
                log.error(`of type ${colorize.error(e.name)}`);
                console.log(e.stack || e.message);
                log.info("Waiting for changes...");
            }
        });
    }

    watch(CONFIG_FILE_ABSOLUTE_PATH, {
        onExists: queueMonorepoSync,
        onChange: queueMonorepoSync,
        onRemove() {
            log.warn(`${colorize.file(CONFIG_FILE_NAME)} deleted. Re-add it to resume watching.`);
        }
    });
    watch(__filename, {
        async onChange() {
            if (activeBuildTask) await activeBuildTask.kill();
            restartProgram(() => {
                log.info("Detected change in program itself.");
            });
        }
    });
}

main();