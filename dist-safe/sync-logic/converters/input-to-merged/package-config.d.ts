import * as t from 'io-ts';
import { MergedPackageConfig } from "../../../common/types/merged-config";
import { PackageConfig } from '../../../common/types/io-ts/config-types';
export declare function mergePackageConfig(templates: Map<string, MergedPackageConfig>, subject: t.TypeOf<typeof PackageConfig>, name?: string, version?: string): MergedPackageConfig;
//# sourceMappingURL=package-config.d.ts.map