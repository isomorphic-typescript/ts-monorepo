#!/usr/bin/env node
import * as path from 'path';
import * as ansicolor from 'ansicolor';
import * as chokidar from 'chokidar';

import { log } from './util/log';
import { restartProgram } from './util/restart-program';
import { validateFilePresence } from './util/validate-presence-in-file-system';
import { syncPackages } from './sync-logic/sync-packages';
import { CommandRunner } from './util/command-runner';

async function main() {
    console.log("");
    log.info(`PID = ${process.pid}`);

    const TS_BUILD_COMMAND = "npx tsc -b --watch --preserveWatchOutput ./tsconfig-leaves.json";
    const configFileRelativePath = "ts-monorepo.json";
    const configAbsolutePath = path.resolve(configFileRelativePath);
    var tsBuild = new CommandRunner(TS_BUILD_COMMAND);

    function acknowledgeWatingForChanges() {
        log.info(ansicolor.green("Waiting for changes..."));
    }
    
    const initialConfigFilePresence = await validateFilePresence(
        configAbsolutePath,
        undefined, 
        configFileRelativePath);
    if (!initialConfigFilePresence.exists || initialConfigFilePresence.wrong) acknowledgeWatingForChanges();

    var currentAction = Promise.resolve();
    function runUpdate(message?: string) {
        currentAction = currentAction.then(async () => {
            if (tsBuild.isRunning()) await tsBuild.kill();
            if (message) log.info(message);
            try {
                await syncPackages(configFileRelativePath, configAbsolutePath);
                tsBuild = new CommandRunner(TS_BUILD_COMMAND);
                await tsBuild.start();
            } catch(e) {
                log.error(`of type ${ansicolor.white(e.name)}`);
                console.log(e.stack || e.message);
                acknowledgeWatingForChanges();
            }
        });
    }

    var timesAdded = 0;
    chokidar.watch(configAbsolutePath)
        .on("change", _path => {
            setTimeout(() => {
                runUpdate(ansicolor.white("Detected change in config file."));
            }, 50);
        })
        .on("add", _path => { // If the file already exists when initially run, then add will fire.
            if (timesAdded === 0 && !initialConfigFilePresence.exists) {
                throw new Error("Bug detected: An initial chokidar add event was triggered but no file system object exists.");
            }
            if (timesAdded === 0 && initialConfigFilePresence.exists && initialConfigFilePresence.wrong) return;
            const updateMessage = (timesAdded === 0 && initialConfigFilePresence.exists) ?
                "Running initial sync..." :
                "Config file created. Running sync...";
            timesAdded++;
            runUpdate(ansicolor.green(updateMessage));
        })
        .on("unlink", _path => {
            log.warn("The config file has been removed.. Please add it again to resume watching.");
        })
        .on("error", async error => {
            if (tsBuild.isRunning()) await tsBuild.kill();
            restartProgram(() => {
                log.error("Chokidar Error '" + error.name + "': " + error.message + (error.stack ? "\n" + ansicolor.default(error.stack) : ""));
            });
        });

    chokidar.watch(__dirname)
        .on("change", async () => {
            if (tsBuild.isRunning()) await tsBuild.kill();
            restartProgram(() => {
                log.info("Detected change in program itself.");
            });
        });
}

main();