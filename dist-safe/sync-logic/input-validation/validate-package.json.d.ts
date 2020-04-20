import * as t from 'io-ts';
import * as either from 'fp-ts/lib/Either';
import { ConfigError } from "../../common/errors";
import { Success } from "../../common/constants";
import { PartialPackageJson } from '../../common/types/io-ts/config-types';
export declare const MANDATORY_PACKAGE_JSON_VALUES: {
    installConfig: {
        pnp: boolean;
    };
};
export declare function validatePackageJson(packageJson: t.TypeOf<typeof PartialPackageJson>, configLocation: string): either.Either<ConfigError[], Success>;
//# sourceMappingURL=validate-package.json.d.ts.map