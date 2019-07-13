import * as ansicolor from 'ansicolor';

import * as child_process from 'child_process';
import { log } from './log';

export class CommandRunner {
    private static OS_IS_WINDOWS = require("os").platform() === 'win32';

    private command: string;
    private commandProcess: child_process.ChildProcess | undefined;
    private startPromise: Promise<void>;
    private startPromiseResolver: (() => void) | undefined;
    private finishedPromise: Promise<void> | undefined;
    private killed = false;

    public constructor(command: string) {
        this.command = command;
        this.startPromise = new Promise(resolve => {
            this.startPromiseResolver = resolve;
        });
    }

    public isRunning() {
        const processIsDefined = this.commandProcess !== undefined;
        const finishedPromiseIsDefined = this.finishedPromise !== undefined;
        if (processIsDefined !== finishedPromiseIsDefined) {
            throw new Error(`Detected problem: process ${
                processIsDefined ? "is" : "us not"} defined whereas its finished promise ${
                    finishedPromiseIsDefined ? "is" : "is not"
                } defined.`);
        }
        return processIsDefined;
    }

    public start() {
        if (this.startPromiseResolver === undefined) {
            throw new Error("startPromiseResolver was not initialized properly");
        }
        if (this.isRunning()) {
            throw new Error("Cannot start process when it is already running");
        }
        log.info(`Command started: '${ansicolor.blue(this.command)}'`);
        const [command, ...commandArgs] = this.command.split(" ");
        this.commandProcess = child_process.spawn(
            `${command}${CommandRunner.OS_IS_WINDOWS ? '.cmd' : ''}`,
            commandArgs, {stdio: 'inherit'});
        const spawnedProcess = this.commandProcess;
        this.commandProcess.on("error", err => {
            log.error("Received Error from process:");
            log.error(err.stack || err.message);
        });
        this.startPromiseResolver();
        this.finishedPromise = new Promise(resolve => {
            spawnedProcess.on("exit", (code, signal) => {
                const codeMessage = code ? ", with code " + code : "";
                const signalMessage = signal ? ", with signal " + signal : "";
                
                log.info(`Command finished: '${ansicolor.blue(this.command)}'${codeMessage}${signalMessage}.`);
                this.killed = true;
                resolve();
            });
        });
    }

    public async waitUntilStart() {
        await this.startPromise;
    }


    public async waitUntilDone() {
        await this.startPromise;
        if (this.finishedPromise === undefined) {
            throw new Error("finishedPromise was not initialized properly");
        }
        await this.finishedPromise;
    }

    public async kill() {
        if (this.commandProcess === undefined) {
            throw new Error("Cannot kill a process that is not running");
        }
        if (this.killed) {
            return; // idempotent
            //throw new Error("Cannot kill a process that has already been killed");
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