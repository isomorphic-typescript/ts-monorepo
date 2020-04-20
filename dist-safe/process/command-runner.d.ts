export declare class CommandRunner {
    private readonly command;
    private static readonly OS_IS_WINDOWS;
    private readonly commandProcess;
    private readonly finishedPromise;
    private killed;
    constructor(command: string);
    waitUntilDone(): Promise<void>;
    kill(): Promise<void>;
}
//# sourceMappingURL=command-runner.d.ts.map