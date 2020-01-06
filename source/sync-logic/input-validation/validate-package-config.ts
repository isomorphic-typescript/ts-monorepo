import * as t from 'io-ts';
import { ConfigError } from "../../common/errors";
import { validatePackageJson } from "./validate-package.json";
import { validateTSConfigJson } from "./validate-tsconfig.json";
import { Either, left, right } from "fp-ts/lib/Either";
import { Success, SUCCESS } from "../../common/constants";
import { PackageConfig } from '../../config-file-structural-checking/io-ts-trial';

export function validatePackageConfig(packageConfig: t.TypeOf<typeof PackageConfig>, configLocation: string): Either<ConfigError[], Success> {
    if (packageConfig.files && packageConfig.files.json) {
        const packageJson = packageConfig.files.json["package.json"];
        const tsConfigJson = packageConfig.files.json["tsconfig.json"];
        return left([
            ...(packageJson ? validatePackageJson(packageJson, configLocation) : []),
            ...(tsConfigJson ? validateTSConfigJson(tsConfigJson, configLocation) : [])
        ]);
    }
    return right(SUCCESS);
}