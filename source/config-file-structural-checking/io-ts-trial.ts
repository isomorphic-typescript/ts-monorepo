import * as t from 'io-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import * as either from 'fp-ts/lib/Either';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as option from 'fp-ts/lib/Option';
import { SUCCESS, Success, PACKAGES_DIRECTORY_NAME, PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX, CONFIG_FILE_NAME } from '../common/constants';
import * as array from 'fp-ts/lib/Array';
import { ConfigError, ErrorType } from '../common/errors';
import { taskEithercoalesceConfigErrors } from '../sync-logic/error-coalesce';
import { traversePackageTree, generateInitialContext, constructPresentableConfigObjectPath } from '../sync-logic/traverse-package-tree';
import { colorize } from '../colorize-special-text';

const NodeDependencyVersioned = t.tuple([t.string, t.string]);
const NodeDependencyUnversioned = t.string;
export const NodeDependency = t.union([NodeDependencyUnversioned, NodeDependencyVersioned]);
const NodeDependencies = t.array(NodeDependency);
const CompletePackageJson = t.type({
    dependencies: NodeDependencies,
    devDependencies: NodeDependencies,
    peerDependencies: NodeDependencies,
    optionalDependencies: NodeDependencies
});
export const PartialPackageJson = t.partial(CompletePackageJson.props, 'package.json');
export const PartialTSConfigJson = t.partial({
    compilerOptions: t.any,
    include: t.array(t.string),
    exclude: t.array(t.string),
    files: t.array(t.string)
}, 'tsconfig.json');
const JsonConfigs = t.partial({
    "package.json": PartialPackageJson,
    "tsconfig.json": PartialTSConfigJson
}, 'json configs');

//const typeNameJunctionConfig = "JunctionConfig";
const typeNamePackageConfig = "PackageConfig";

export const PackageConfig = t.intersection([
    t.type({
        extends: t.array(t.string)
    }),
    t.partial({
        files: t.partial({
            json: JsonConfigs
        }),
        skoville: t.intersection([
            t.type({
                autoRestart: t.boolean,
                hot: t.boolean,
                serverAt: t.string
            }),
            t.partial({
                entry: t.string
            })
        ])
    })
], typeNamePackageConfig);
export const JunctionConfig = t.UnknownRecord;

export const TSMonorepoJson = t.intersection([
    t.type({
        version: t.string,
        ttypescript: t.boolean,
        cleanBeforeCompile: t.boolean,
    }),
    t.partial({
        templates: t.record(t.string, PackageConfig),
        packages: t.UnknownRecord
    })
]);

const packageConfigExplanation = `For a ${typeNamePackageConfig}, ensure that the name segment ends with "${PACKAGE_NAME_CONFIG_PATH_REQUIRED_SUFFIX}"`;

export const validatePackageConfig = (configPath: string[]) => (input: unknown) => pipe(
    PackageConfig.decode(input),
    either.mapLeft(convertErorrs(configPath, configPath[0] === PACKAGES_DIRECTORY_NAME ? packageConfigExplanation : undefined))
);

export const validateJunctionConfig = (configPath: string[]) => (input: unknown) => pipe(
    JunctionConfig.decode(input),
    either.mapLeft(convertErorrs(configPath, configPath[0] === PACKAGES_DIRECTORY_NAME && configPath.length > 2 ? packageConfigExplanation : undefined))
);

const convertErorrs = (pathPrefix: string[], additionalMessage?: string) => (errors: t.Errors): ConfigError[] => {
    return errors.map(error => ({
        type: ErrorType.InvalidConfig,
        message: (() => {
            const lastContextEntry = error.context[error.context.length - 1];
            const keyPath = constructPresentableConfigObjectPath([
                ...pathPrefix,
                ...error.context.map(contextEntry => contextEntry.key).filter(key => key.length > 0)
            ]);
            return `Error at ${colorize.file(CONFIG_FILE_NAME)}${keyPath}. Expected type ${lastContextEntry.type.name} but instead got value ${lastContextEntry.actual}${additionalMessage ? "\n" + additionalMessage : ""}`;
        })()
    }));
}

export function validateTSMonoRepoJsonShape(input: Object): taskEither.TaskEither<ConfigError[], t.TypeOf<typeof TSMonorepoJson>> {
    console.log("object = " + input);
    return pipe(
        // First validate shape of the json.
        TSMonorepoJson.decode(input),
        either.mapLeft(convertErorrs([])),
        // Second, traverse the packages, and validate the shape of each recursively.
        taskEither.fromEither,
        taskEither.chain(validInput => pipe(
            option.fromNullable(validInput.packages),
            taskEither.fromOption<Success>(() => SUCCESS),
            taskEither.fold(
                taskEither.right,
                packages => pipe(
                    Object.entries(packages),
                    array.map(([scopeName, packageJunction]) => pipe(
                        packageJunction,
                        validateJunctionConfig([PACKAGES_DIRECTORY_NAME, scopeName]),
                        taskEither.fromEither,
                        taskEither.chain(validPackageJunction => traversePackageTree(
                            validPackageJunction,
                            generateInitialContext(scopeName),
                            () => taskEither.right(SUCCESS), // The traverse is already validating.
                            () => taskEither.right(SUCCESS) // The traverse is already validating.
                        ))
                    )),
                    taskEithercoalesceConfigErrors
                )
            ),
            taskEither.map(() => validInput)
        ))
    )
}