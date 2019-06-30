#!/usr/bin/env node
import * as path from 'path';
import * as ansicolor from 'ansicolor';
import * as chokidar from 'chokidar';

import { log } from './util/log';
import { restartProgram } from './util/restart-program';
import { validateFilePresence } from './util/validate-presence-in-file-system';
import { syncPackages } from './sync-logic/sync-packages';
import { TSBuild } from './ts-build';

async function main() {
    console.log("");

    const configFileRelativePath = "ts-monorepo.json";
    const configAbsolutePath = path.resolve(configFileRelativePath);
    const tsBuild = new TSBuild();

    function acknowledgeWatingForChanges() {
        log.info(ansicolor.green("Waiting for changes..."));
    }
    
    const initialConfigFilePresence = await validateFilePresence(
        configAbsolutePath, 
        false, false, 
        undefined, 
        configFileRelativePath);
    if (!initialConfigFilePresence.exists || initialConfigFilePresence.wrong) acknowledgeWatingForChanges();

    var currentAction = Promise.resolve();
    function runUpdate(message?: string) {
        currentAction = currentAction.then(() => {
            if (tsBuild.isRunning()) tsBuild.stop();
            if (message) log.info(message);
            return syncPackages(configFileRelativePath, configAbsolutePath)
                .catch((e) => {
                    log.error(e.message);
                    console.log(e);
                })
                .finally(() => {
                    acknowledgeWatingForChanges();
                    tsBuild.start();
                });
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
        .on("error", error => {
            if (tsBuild.isRunning()) tsBuild.stop();
            restartProgram(() => {
                log.error("Chokidar Error '" + error.name + "': " + error.message + (error.stack ? "\n" + ansicolor.default(error.stack) : ""));
            });
        });

    chokidar.watch(__dirname)
        .on("change", () => {
            if (tsBuild.isRunning()) tsBuild.stop();
            restartProgram(() => {
                log.info("Detected change in program itself.");
            });
        });
}

main();

// Have to do this because I use goddamn MinTTy w/ Msys2. https://github.com/nodejs/node/issues/16103
// From https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
/*
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
//(process.stdin as any).setRawMode(true);
process.stdin.on('keypress', (_str, key) => {
    if(key.name === 'q') {
        console.log("quitting");
        process.exit();
    }
});
*/