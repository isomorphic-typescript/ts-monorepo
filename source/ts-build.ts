import * as child_process from 'child_process';
import { log } from './util/log';
import ansicolor = require('ansicolor');

const osIsWindows = require('os').platform() === 'win32';

export class TSBuild {
    private static TSC_BUILD_COMMAND = "tsc -b --watch --preserveWatchOutput ./tsconfig-leaves.json";

    private buildProcess: child_process.ChildProcessWithoutNullStreams | undefined;

    public constructor() {}

    public isRunning() {
        return this.buildProcess !== undefined;
    }

    public start() {
        if (this.buildProcess !== undefined) {
            log.error("Trying to start the tsc watching build when process already running.");
            return;
        }
        log.info(`Running '${ansicolor.white(TSBuild.TSC_BUILD_COMMAND)}'`);
        const command = osIsWindows ? "npx.cmd" : "npx";
        const curProcess = this.buildProcess = child_process.spawn(command, TSBuild.TSC_BUILD_COMMAND.split(" "));

        this.buildProcess.stdout.on("data", data => {
            if (this.buildProcess !== curProcess) {
                log.error(`received stdout from PID ${curProcess.pid} which should have already been killed`);
                return;
            }
            const text: string = data.toString();
            text
                .split("\n")
                .forEach(line => {
                    log.info(line);
                });
        });
        this.buildProcess.stderr.on("data", data => {
            if (this.buildProcess !== curProcess) {
                log.error(`received stdin  from PID ${curProcess.pid} which should have already been killed`);
                return;
            }
            const text: string = data.toString();
            text
                .split("\n")
                .forEach(line => {
                    log.error(ansicolor.default(line));
                });
        });
        this.buildProcess.on("exit", () => {
            log.info(`The '${ansicolor.white(TSBuild.TSC_BUILD_COMMAND)}' command has stopped.`);
            if (this.buildProcess !== undefined) {
                this.buildProcess = undefined;
            }
        });
    }

    public stop() {
        if (this.buildProcess === undefined) {
            log.error("Trying to stop the tsc watching build when it is already stopped");
            return;
        }
        if(osIsWindows) {
            child_process.execSync("taskkill /F /T /pid " + this.buildProcess.pid);
        }
        this.buildProcess.kill("SIGINT");
        this.buildProcess = undefined;
    }
}