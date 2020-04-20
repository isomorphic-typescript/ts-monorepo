import * as t from 'io-ts';
import * as either from 'fp-ts/lib/Either';
import * as array from 'fp-ts/lib/Array';
import { ConfigError, ErrorType } from "../../common/errors";
import { PACKAGES_DIRECTORY_NAME, Success, SUCCESS } from "../../common/constants";
import { colorize } from "../../colorize-special-text";
import { PartialPackageJson, NodeDependency } from '../../common/types/io-ts/config-types';
import { pipe } from 'fp-ts/lib/pipeable';
import { eitherCoalesceConfigErrors } from '../error-coalesce';

// TODO: when validating, ensure that client has not explicitly set this (similar to tsconfig.json). Also consider making such logic & validations more generic.
export const MANDATORY_PACKAGE_JSON_VALUES = {
    installConfig: {
        pnp: true
    }
};

function validateDependencies(dependencies: t.TypeOf<typeof NodeDependency>[] | undefined, dependencyField: string, configLocation: string): either.Either<ConfigError[], Success> {
    if (dependencies) {
        const seenDeps = new Set<string>();
        const depsWithError = new Set<string>();
        return pipe(
            dependencies,
            array.map(dependency => {
                const dependencyName = Array.isArray(dependency) ? dependency[0] : dependency;
                if (seenDeps.has(dependencyName)) {
                    if (!depsWithError.has(dependencyName)) {
                        depsWithError.add(dependencyName);
                        return either.left([{
                            type: ErrorType.DuplicateDependencyInPackageJsonConfig,
                            message: `${configLocation} the package.json ${dependencyField} has multiple entries for package ${colorize.package(dependencyName)}`
                        }])
                        
                    }
                } else {
                    seenDeps.add(dependencyName);
                }
                return either.right(SUCCESS);
            }),
            eitherCoalesceConfigErrors
        )
    }
    return either.right(SUCCESS);
}

export function validatePackageJson(packageJson: t.TypeOf<typeof PartialPackageJson>, configLocation: string): either.Either<ConfigError[], Success> {
    return pipe(
        [
            (() => {
                const packageJsonWithAnyPossibleValue = packageJson as any;
                if ('name' in packageJsonWithAnyPossibleValue) {
                    return either.left([{
                        type: ErrorType.ExplicitNameInPackageJsonConfig,
                        message: `${configLocation} the package.json illegally specifies an explicit name '${packageJsonWithAnyPossibleValue.name
                        }'. Package names will be written to output package.json files by contatenating nested keys under the ${PACKAGES_DIRECTORY_NAME} object.`
                    }]);
                }
                return either.right(SUCCESS);
            })(),
            validateDependencies(packageJson.dependencies, 'dependencies', configLocation),
            validateDependencies(packageJson.devDependencies, 'devDependencies', configLocation),
            validateDependencies(packageJson.optionalDependencies, 'optionalDependencies', configLocation),
            validateDependencies(packageJson.peerDependencies, 'peerDependencies', configLocation)
        ],
        eitherCoalesceConfigErrors
    );
}