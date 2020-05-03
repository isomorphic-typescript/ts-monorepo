interface ProgramChanges {
    filesAdded: string[];
    filesRemoved: string[];
    filesChanged: string[];
    filesWithSignatureChanges: string[];
}
export declare const detectProgramChanges: () => Promise<ProgramChanges | undefined>;
export {};
//# sourceMappingURL=self-change-detector.d.ts.map