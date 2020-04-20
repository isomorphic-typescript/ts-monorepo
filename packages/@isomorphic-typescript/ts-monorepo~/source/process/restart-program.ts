import * as child_process from 'child_process';
import { log } from '../logging/log';

var restarting = false;
export async function restartProgram(idempotentPreRestartFn: () => Promise<void> | undefined) {
    if (restarting) return;
    restarting = true;
    if (idempotentPreRestartFn) await idempotentPreRestartFn();
    log.trace("Restarting process...");
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
}