import * as t from 'io-ts';
import { ConfigError } from "../../common/errors";
import { validatePackageJson } from "./validate-package.json";
import { validateTSConfigJson } from "./validate-tsconfig.json";
import * as either from "fp-ts/lib/Either";
import { Success, SUCCESS } from "../../common/constants";
import { PackageConfig } from '../../common/types/io-ts/config-types';
import { pipe } from 'fp-ts/lib/pipeable';
import { eitherCoalesceConfigErrors } from '../error-coalesce';

export function validatePackageConfig(packageConfig: t.TypeOf<typeof PackageConfig>, configLocation: string): either.Either<ConfigError[], Success> {
    if (packageConfig.files && packageConfig.files.json) {
        const packageJson = packageConfig.files.json["package.json"];
        const tsConfigJson = packageConfig.files.json["tsconfig.json"];
        return pipe(
            [
                (packageJson ? validatePackageJson(packageJson, configLocation) : either.right(SUCCESS)),
                (tsConfigJson ? validateTSConfigJson(tsConfigJson, configLocation) : either.right(SUCCESS))
            ],
            eitherCoalesceConfigErrors
        );
    }
    return either.right(SUCCESS);
}