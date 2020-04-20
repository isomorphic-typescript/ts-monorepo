import * as t from 'io-ts';
import { ConfigError } from "../../common/errors";
import * as either from "fp-ts/lib/Either";
import { Success } from "../../common/constants";
import { PackageConfig } from '../../common/types/io-ts/config-types';
export declare function validatePackageConfig(packageConfig: t.TypeOf<typeof PackageConfig>, configLocation: string): either.Either<ConfigError[], Success>;
//# sourceMappingURL=validate-package-config.d.ts.map