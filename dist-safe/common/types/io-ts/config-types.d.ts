import * as t from 'io-ts';
import * as either from 'fp-ts/lib/Either';
import * as taskEither from 'fp-ts/lib/TaskEither';
import { ConfigError } from '../../errors';
export declare const SemanticVersion: t.Type<string, string, unknown>;
export declare const NodeDependency: t.Type<string | [string, string], string, unknown>;
export declare const CompletePackageJson: t.TypeC<{
    version: t.Type<string, string, unknown>;
    dependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
    devDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
    peerDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
    optionalDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
}>;
export declare const PartialPackageJson: t.PartialC<{
    version: t.Type<string, string, unknown>;
    dependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
    devDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
    peerDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
    optionalDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
}>;
export declare const PartialTSConfigJson: t.PartialC<{
    compilerOptions: t.AnyC;
    include: t.ArrayC<t.StringC>;
    exclude: t.ArrayC<t.StringC>;
    files: t.ArrayC<t.StringC>;
}>;
export declare const PackageConfig: import("./exactly").Exactly<t.IntersectionC<[t.TypeC<{
    extends: t.ArrayC<t.StringC>;
}>, t.PartialC<{
    files: import("./exactly").Exactly<t.PartialC<{
        json: t.PartialC<{
            "package.json": t.PartialC<{
                version: t.Type<string, string, unknown>;
                dependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                devDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                peerDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                optionalDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
            }>;
            "tsconfig.json": t.PartialC<{
                compilerOptions: t.AnyC;
                include: t.ArrayC<t.StringC>;
                exclude: t.ArrayC<t.StringC>;
                files: t.ArrayC<t.StringC>;
            }>;
        }>;
    }>, {
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
    }, {
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
    }, unknown>;
    skoville: t.IntersectionC<[t.TypeC<{
        autoRestart: t.BooleanC;
        hot: t.BooleanC;
        serverAt: t.StringC;
    }>, t.PartialC<{
        entry: t.StringC;
    }>]>;
}>]>, {
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
}, {
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
}, unknown>;
export declare const JunctionConfig: t.RecordC<t.StringC, t.UnknownC>;
export declare const TSMonorepoJson: import("./exactly").Exactly<t.IntersectionC<[t.TypeC<{
    version: t.Type<string, string, unknown>;
    ttypescript: t.BooleanC;
    port: t.BrandC<t.NumberC, t.IntBrand>;
}>, t.PartialC<{
    templates: t.RecordC<t.StringC, import("./exactly").Exactly<t.IntersectionC<[t.TypeC<{
        extends: t.ArrayC<t.StringC>;
    }>, t.PartialC<{
        files: import("./exactly").Exactly<t.PartialC<{
            json: t.PartialC<{
                "package.json": t.PartialC<{
                    version: t.Type<string, string, unknown>;
                    dependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                    devDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                    peerDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                    optionalDependencies: t.ArrayC<t.Type<string | [string, string], string, unknown>>;
                }>;
                "tsconfig.json": t.PartialC<{
                    compilerOptions: t.AnyC;
                    include: t.ArrayC<t.StringC>;
                    exclude: t.ArrayC<t.StringC>;
                    files: t.ArrayC<t.StringC>;
                }>;
            }>;
        }>, {
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
        }, {
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
        }, unknown>;
        skoville: t.IntersectionC<[t.TypeC<{
            autoRestart: t.BooleanC;
            hot: t.BooleanC;
            serverAt: t.StringC;
        }>, t.PartialC<{
            entry: t.StringC;
        }>]>;
    }>]>, {
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
    }, {
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
    }, unknown>>;
    packages: t.UnknownRecordC;
}>]>, {
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
}, {
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
}, unknown>;
export declare const validatePackageConfig: (configPath: string[]) => (input: unknown) => either.Either<ConfigError[], {
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
}>;
export declare const validateJunctionConfig: (configPath: string[]) => (input: unknown) => either.Either<ConfigError[], {
    [x: string]: unknown;
}>;
export declare type MonorepoConfig = t.TypeOf<typeof TSMonorepoJson>;
export declare function validateTSMonoRepoJsonShape(input: Object): taskEither.TaskEither<ConfigError[], MonorepoConfig>;
//# sourceMappingURL=config-types.d.ts.map