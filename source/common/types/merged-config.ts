import * as t from 'io-ts';
import { CompletePackageJson } from '../../config-file-structural-checking/io-ts-trial';
import { MandatoryTSConfigJsonValues } from '../../sync-logic/input-validation/validate-tsconfig.json';

export type MergedPackageJson = t.TypeOf<typeof CompletePackageJson> & {
    name: string;
}

export interface MergedPackageConfig {
    files: {
        json: {
            "package.json": MergedPackageJson,
            "tsconfig.json": typeof MandatoryTSConfigJsonValues
        }
    }
    // TODO: include space for skoville config.
}