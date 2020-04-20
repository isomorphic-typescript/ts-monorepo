import * as t from 'io-ts';
import * as taskEither from 'fp-ts/lib/TaskEither';
import { ConfigError } from '../common/errors';
import { SUCCESS } from '../common/constants';
export declare const validateNoUnexpectedFolders: (monorepoConfig: {
    version: string;
    ttypescript: boolean;
    port: t.Branded<number, t.IntBrand>;
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
}) => taskEither.TaskEither<ConfigError[], typeof SUCCESS>;
//# sourceMappingURL=validate-no-unexpected-folders.d.ts.map