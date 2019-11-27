import * as child_process from 'child_process';
import { log } from './log';
import { colorize } from '../colorize-special-text';

export class CommandRunner {
    private static OS_IS_WINDOWS = require("os").platform() === 'win32';
    private readonly commandProcess: child_process.ChildProcess;
    private readonly finishedPromise: Promise<void>;
    private killed = false;

    public constructor(private readonly command: string) {
        log.info(`Command started: '${colorize.command(this.command)}'`);
        const [executableName, ...commandArgs] = this.command.split(" ");
        this.commandProcess = child_process.spawn(
            `${executableName}${CommandRunner.OS_IS_WINDOWS ? '.cmd' : ''}`,
            commandArgs, {stdio: 'inherit'});
        this.finishedPromise = new Promise(resolve => {
            this.commandProcess
                .on("error", err => {
                    log.error("Received Error from process:");
                    log.error(err.stack || err.message);
                })
                .on("exit", (code, signal) => {
                    const codeMessage = code ? ", with code " + code : "";
                    const signalMessage = signal ? ", with signal " + signal : "";
                    
                    log.info(`Command finished: '${colorize.command(this.command)}'${codeMessage}${signalMessage}.`);
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
        }
        this.commandProcess.kill("SIGINT");
        this.commandProcess.kill("SIGKILL");
        this.commandProcess.kill("SIGQUIT");
        this.killed = true;
        await this.waitUntilDone();
    }
}