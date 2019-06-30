import { log } from './log';

var restarting = false;
export function restartProgram(idempotentPreRestartFn?: Function) {
    if (restarting) return;
    restarting = true;
    if (idempotentPreRestartFn) idempotentPreRestartFn();
    log.trace("Restarting process...");
    setTimeout(() => {
        process.on("exit", function () {
            require("child_process").spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached : true,
                stdio: "inherit"
            })//.unref();
        });
        process.exit();
    }, 20);
}