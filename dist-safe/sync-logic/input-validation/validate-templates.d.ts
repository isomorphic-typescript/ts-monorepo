import * as t from 'io-ts';
import { PackageConfig } from '../../common/types/io-ts/config-types';
import { MergedPackageConfig } from "../../common/types/merged-config";
import { ConfigError } from "../../common/errors";
import { Either } from 'fp-ts/lib/Either';
export declare function validateAndMergeTemplates(templates: {
    [name: string]: t.TypeOf<typeof PackageConfig>;
}): Either<ConfigError[], Map<string, MergedPackageConfig>>;
//# sourceMappingURL=validate-templates.d.ts.map