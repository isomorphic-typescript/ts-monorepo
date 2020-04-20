import * as t from 'io-ts';
import { CompletePackageJson } from './io-ts/config-types';
import { MandatoryTSConfigJsonValues } from '../../sync-logic/input-validation/validate-tsconfig.json';
export declare type MergedPackageJson = t.TypeOf<typeof CompletePackageJson> & {
    name: string;
};
export interface MergedPackageConfig {
    files: {
        json: {
            "package.json": MergedPackageJson;
            "tsconfig.json": typeof MandatoryTSConfigJsonValues;
        };
    };
}
//# sourceMappingURL=merged-config.d.ts.map