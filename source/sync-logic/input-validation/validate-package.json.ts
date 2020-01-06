import * as t from 'io-ts';
import { ConfigError, ErrorType } from "../../common/errors";
import { PACKAGES_DIRECTORY_NAME } from "../../common/constants";
import { colorize } from "../../colorize-special-text";
import { PartialPackageJson, NodeDependency } from '../../config-file-structural-checking/io-ts-trial';

export function validatePackageJson(packageJson: t.TypeOf<typeof PartialPackageJson>, configLocation: string): ConfigError[] {
    function validateDependencies(dependencies: t.TypeOf<typeof NodeDependency>[] | undefined, dependencyField: string): ConfigError[] {
        const errors: ConfigError[] = [];
        if (dependencies) {
            const seenDeps = new Set<string>();
            const depsWithError = new Set<string>();
            for (const dependency of dependencies) {
                const dependencyName = Array.isArray(dependency) ? dependency[0] : dependency;
                if (seenDeps.has(dependencyName)) {
                    if (!depsWithError.has(dependencyName)) {
                        errors.push({
                            type: ErrorType.DuplicateDependencyInPackageJsonConfig,
                            message: `${configLocation} the package.json ${dependencyField} has multiple entries for package ${colorize.package(dependencyName)}`
                        });
                        depsWithError.add(dependencyName);
                    }
                } else {
                    seenDeps.add(dependencyName);
                }
            }
        }
        return [];
    }
    const packageJsonWithAnyPossibleValue = packageJson as any;
    const errors: ConfigError[] = [];
    if ('name' in packageJsonWithAnyPossibleValue) {
        errors.push({
            type: ErrorType.ExplicitNameInPackageJsonConfig,
            message: `${configLocation} the package.json illegally specifies an explicit name '${packageJsonWithAnyPossibleValue.name
            }'. Package names will be written to output package.json files by contatenating nested keys under the ${PACKAGES_DIRECTORY_NAME} object.`
        });
    }
    // TODO: ensure that if different dependencies fields declare the same dependency, that both use the same version of the dependency.
    errors.push(
        ...validateDependencies(packageJson.dependencies, 'dependencies'),
        ...validateDependencies(packageJson.devDependencies, 'devDependencies'),
        ...validateDependencies(packageJson.optionalDependencies, 'optionalDependencies'),
        ...validateDependencies(packageJson.peerDependencies, 'peerDependencies')
    )
    return errors;
}