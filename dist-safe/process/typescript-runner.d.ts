import { Terminateable } from "../common/types/traits";
export declare const startTypeScript: (monorepoConfig: {
    version: string;
    ttypescript: boolean;
    port: import("io-ts").Branded<number, import("io-ts").IntBrand>;
} & {
    templates?: {
        [x: string]: {
            extends: string[];
        } & {
            files?: {
                json?: {
                    "package.json"?: {
                        version?: string | undefined;
                        dependencies?: (string | [string, string])[] | undefined;
                        devDependencies?: (string | [string, string])[] | undefined;
                        peerDependencies?: (string | [string, string])[] | undefined;
                        optionalDependencies?: (string | [string, string])[] | undefined;
                    } | undefined;
                    "tsconfig.json"?: {
                        compilerOptions?: any;
                        include?: string[] | undefined;
                        exclude?: string[] | undefined;
                        files?: string[] | undefined;
                    } | undefined;
                } | undefined;
            } | undefined;
            skoville?: ({
                autoRestart: boolean;
                hot: boolean;
                serverAt: string;
            } & {
                entry?: string | undefined;
            }) | undefined;
        };
    } | undefined;
    packages?: {
        [key: string]: unknown;
    } | undefined;
}) => Terminateable;
//# sourceMappingURL=typescript-runner.d.ts.map