import * as t from 'io-ts';
import * as either from 'fp-ts/lib/Either';
import { PartialTSConfigJson } from '../../common/types/io-ts/config-types';
import { ConfigError } from "../../common/errors";
import { Success } from "../../common/constants";
export declare const MandatoryTSConfigJsonValues: {
    compilerOptions: {
        rootDir: string;
        outDir: string;
        composite: boolean;
        declaration: boolean;
        declarationMap: boolean;
        sourceMap: boolean;
    };
    references: never[];
};
export declare function validateTSConfigJson(tsConfig: t.TypeOf<typeof PartialTSConfigJson>, configLocation: string): either.Either<ConfigError[], Success>;
//# sourceMappingURL=validate-tsconfig.json.d.ts.map