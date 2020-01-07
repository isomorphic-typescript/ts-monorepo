import * as path from 'path';
import { ConfigError } from '../common/errors';
import { PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX, GLOBAL_SCOPE_NAME, PACKAGES_DIRECTORY_RELATIVE_PATH, PACKAGES_DIRECTORY_NAME, Success } from '../common/constants';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import * as array from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { taskEithercoalesceConfigErrors } from './error-coalesce';
import { validatePackageConfig, PackageConfig, JunctionConfig, validateJunctionConfig } from '../config-file-structural-checking/io-ts-trial';

const lowercaseAlphanumeric = /[a-z0-9]/;
function removeLeadingPunctuation(packageNameSegment: string): string {
    for (var currentIndex = 0; currentIndex < packageNameSegment.length; ++currentIndex) {
        if (packageNameSegment[currentIndex].match(lowercaseAlphanumeric)) {
            return packageNameSegment.slice(currentIndex);
        }
    }
    return "";
}

export const nameSegmentToSubFolderName = removeLeadingPunctuation;

export interface ConfigTreeTraversalContext {
    packageNamePrefix: string;
    relativePath: string;
    pathSegment: string;
    configObjectPath: string[];
    packageNameSegment: string;
}

export function generateInitialContext(scope: string) {
    const scopePackageNameSegment = scope === GLOBAL_SCOPE_NAME ? "" : `${scope}/`;
    const initialContext: ConfigTreeTraversalContext = {
        packageNamePrefix: scopePackageNameSegment,
        relativePath: path.join(PACKAGES_DIRECTORY_RELATIVE_PATH, scope),
        configObjectPath: [PACKAGES_DIRECTORY_NAME, scope],
        pathSegment: scope,
        packageNameSegment: scopePackageNameSegment
    };
    return initialContext;
}

function resolvePackageNameFromContext(context: ConfigTreeTraversalContext) {
    return context.packageNamePrefix.substring(0, context.packageNamePrefix.length - PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX.length);
}

export function constructPresentableConfigObjectPath(configObjectPath: string[]): string {
    return configObjectPath.map(key => `[${key}]`).join("");
}

export function traversePackageTree(
        config: unknown,
        context: ConfigTreeTraversalContext,
        packageHandler: (packageConfig: t.TypeOf<typeof PackageConfig>, context: ConfigTreeTraversalContext, completePackageName: string) => taskEither.TaskEither<ConfigError[], Success>,
        junctionHandler: (junctionConfig: t.TypeOf<typeof JunctionConfig>, context: ConfigTreeTraversalContext, childContexts: Record<string, ConfigTreeTraversalContext>) => taskEither.TaskEither<ConfigError[], Success>
    ): taskEither.TaskEither<ConfigError[], Success> {
    const isPackageConfig = context.packageNamePrefix.endsWith(PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX);
    if (isPackageConfig) {
        return pipe(
            validatePackageConfig(context.configObjectPath)(config),
            taskEither.fromEither,
            taskEither.chain(packageConfig => packageHandler(packageConfig, context, resolvePackageNameFromContext(context)))
        );
    } else {
        return pipe(
            validateJunctionConfig(context.configObjectPath)(config),
            taskEither.fromEither,
            taskEither.chain(junctionConfig => {
                const childContexts = pipe(
                    Object.keys(junctionConfig),
                    array.map(nameSegment => {
                        const pathSegment = nameSegmentToSubFolderName(nameSegment);
                        return [
                            nameSegment,
                            {
                                packageNamePrefix: `${context.packageNamePrefix}${nameSegment}`,
                                relativePath: path.join(context.relativePath, pathSegment),
                                configObjectPath: [...context.configObjectPath, nameSegment],
                                pathSegment,
                                packageNameSegment: nameSegment
                            }
                        ];
                    }),
                    Object.fromEntries
                );
                return pipe(
                    junctionHandler(junctionConfig, context, childContexts),
                    taskEither.chain(() => pipe(
                        Object.entries(junctionConfig),
                        array.map(([nameSegment, childConfig]) => traversePackageTree(
                            childConfig,
                            childContexts[nameSegment],
                            packageHandler, junctionHandler
                        )),
                        taskEithercoalesceConfigErrors
                    ))
                );
            })
        );
    }
}