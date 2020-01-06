import { log } from './log';

var restarting = false;
export async function restartProgram(idempotentPreRestartFn: () => Promise<void> | undefined) {
    if (restarting) return;
    restarting = true;
    if (idempotentPreRestartFn) await idempotentPreRestartFn();
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