import * as child_process from 'child_process';
import { log } from '../logging/log';
import { colorize } from '../colorize-special-text';

export class CommandRunner {
    private static readonly OS_IS_WINDOWS = require("os").platform() === 'win32';
    private readonly commandProcess: child_process.ChildProcess;
    private readonly finishedPromise: Promise<void>;
    private killed = false;

    public constructor(private readonly command: string) {
        const [executableName, ...commandArgs] = this.command.split(" ");
        this.commandProcess = child_process.spawn(
            `${executableName}${CommandRunner.OS_IS_WINDOWS ? '.cmd' : ''}`,
            commandArgs, {stdio: 'inherit', cwd: process.cwd() });
        if (this.commandProcess.pid === undefined) {
            log.error(`Unable to start command ${colorize.command(this.command)}`);
        } else {
            log.info(`Command started on PID ${this.commandProcess.pid}: ${colorize.command(this.command)}`);
        }
        this.finishedPromise = new Promise(resolve => {
            this.commandProcess
                .on("error", err => {
                    log.error("Received Error from process:");
                    log.error(err.stack || err.message);
                    resolve();
                })
                .on("exit", (code, signal) => {
                    const codeMessage = code ? " with code " + code : "";
                    const signalMessage = signal ? " via " + signal : "";
                    const doneVerb = (codeMessage.length === 0 && signalMessage.length === 0) ? "finished" : "terminated";
                    
                    log.info(`Command ${doneVerb}${codeMessage}${signalMessage}: ${colorize.command(this.command)}`);
                    this.killed = true;
                    resolve();
                });
        });
    }

    public async waitUntilDone() {
        await this.finishedPromise;
    }

    public async kill() {
        if (this.killed) {
            return; // idempotent
        }
        if(CommandRunner.OS_IS_WINDOWS) {
            child_process.execSync("taskkill /F /T /pid " + this.commandProcess.pid);
        } else {
            this.commandProcess.kill("SIGTERM");
            this.commandProcess.kill("SIGINT");
            this.commandProcess.kill("SIGKILL");
            this.commandProcess.kill("SIGQUIT");
        }
        this.killed = true;
        await this.waitUntilDone();
    }
}