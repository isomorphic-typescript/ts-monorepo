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
var restarting = false;
function restartProgram(idempotentPreRestartFn) {
    return __awaiter(this, void 0, void 0, function* () {
        if (restarting)
            return;
        restarting = true;
        if (idempotentPreRestartFn)
            yield idempotentPreRestartFn();
        log_1.log.trace("Restarting process...");
        setTimeout(() => {
            process.on("exit", function () {
                // TODO: change back to "spawn(process.argv.shift(), process.argv, {..." after this is resolved: https://github.com/yarnpkg/berry/issues/1218
                child_process.spawn('yarn', ['build:rapid'], {
                    cwd: process.cwd(),
                    detached: true,
                    stdio: "inherit"
                });
            });
            process.exit();
        }, 20);
    });
}
exports.restartProgram = restartProgram;
//# sourceMappingURL=restart-program.js.map