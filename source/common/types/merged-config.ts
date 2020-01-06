import * as t from 'io-ts';
import { NodeDependency } from '../../config-file-structural-checking/io-ts-trial';

export interface MergedPackageJson {
    name: string;
    version: string;
    dependencies: t.TypeOf<typeof NodeDependency>[];
    devDependencies: t.TypeOf<typeof NodeDependency>[];
    peerDependencies: t.TypeOf<typeof NodeDependency>[];
    optionalDependencies: t.TypeOf<typeof NodeDependency>[];
}

export interface MergedPackageConfig {
    files: {
        json: {
            "package.json": MergedPackageJson
        }
    }
    // TODO: include space for skoville config.
}