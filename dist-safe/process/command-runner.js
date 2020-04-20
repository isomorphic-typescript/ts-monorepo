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
const child_process = require("child_process");
const log_1 = require("../logging/log");
const colorize_special_text_1 = require("../colorize-special-text");
class CommandRunner {
    constructor(command) {
        this.command = command;
        this.killed = false;
        const [executableName, ...commandArgs] = this.command.split(" ");
        this.commandProcess = child_process.spawn(`${executableName}${CommandRunner.OS_IS_WINDOWS ? '.cmd' : ''}`, commandArgs, { stdio: 'inherit', cwd: process.cwd() });
        if (this.commandProcess.pid === undefined) {
            log_1.log.error(`Unable to start command ${colorize_special_text_1.colorize.command(this.command)}`);
        }
        else {
            log_1.log.info(`Command started on PID ${this.commandProcess.pid}: ${colorize_special_text_1.colorize.command(this.command)}`);
        }
        this.finishedPromise = new Promise(resolve => {
            this.commandProcess
                .on("error", err => {
                log_1.log.error("Received Error from process:");
                log_1.log.error(err.stack || err.message);
            })
                .on("exit", (code, signal) => {
                const codeMessage = code ? " with code " + code : "";
                const signalMessage = signal ? " via " + signal : "";
                const doneVerb = (codeMessage.length === 0 && signalMessage.length === 0) ? "finished" : "terminated";
                log_1.log.info(`Command ${doneVerb}${codeMessage}${signalMessage}: ${colorize_special_text_1.colorize.command(this.command)}`);
                this.killed = true;
                resolve();
            });
        });
    }
    waitUntilDone() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.finishedPromise;
        });
    }
    kill() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.killed) {
                return; // idempotent
            }
            if (CommandRunner.OS_IS_WINDOWS) {
                child_process.execSync("taskkill /F /T /pid " + this.commandProcess.pid);
            }
            else {
                this.commandProcess.kill("SIGTERM");
                this.commandProcess.kill("SIGINT");
                this.commandProcess.kill("SIGKILL");
                this.commandProcess.kill("SIGQUIT");
            }
            this.killed = true;
            yield this.waitUntilDone();
        });
    }
}
exports.CommandRunner = CommandRunner;
CommandRunner.OS_IS_WINDOWS = require("os").platform() === 'win32';
//# sourceMappingURL=command-runner.js.map