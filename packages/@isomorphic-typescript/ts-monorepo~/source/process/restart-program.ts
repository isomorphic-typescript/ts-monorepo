import { log } from '../logging/log';
import { ChildToParentMessage } from './parent-child-rpc';
import { parentPort } from 'worker_threads';

var restarting = false;
export async function restartProgram(idempotentPreRestartFn: () => Promise<void> | undefined) {
    if (restarting) return;
    restarting = true;
    if (idempotentPreRestartFn) await idempotentPreRestartFn();
    log.trace("Restarting...");
    const toSend: ChildToParentMessage = { type: "restart" };
    parentPort!.postMessage(JSON.stringify(toSend));
}