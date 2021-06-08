import { MonorepoPackageRegistry } from "../../../../package-dependency-logic/monorepo-package-registry";
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import { ConfigError } from "../../../../common/errors";
import { pipe } from 'fp-ts/lib/function';
import { assertFileSystemObjectType } from "../../../../file-system/presence-assertions";
import { MONOREPO_PACKAGE_JSON_RELATIVE_PATH, MONOREPO_PACKAGE_JSON_ABSOLUTE_PATH } from "../../../../common/constants";
import { FileSystemObjectType } from "../../../../file-system/object";
import * as fs from 'fs';

export function monorepoPackageRegistryToMonorepoRootPackageJson(monorepoPackageRegistry: MonorepoPackageRegistry): taskEither.TaskEither<ConfigError[], Object> {
    return pipe(
        assertFileSystemObjectType(MONOREPO_PACKAGE_JSON_RELATIVE_PATH, [FileSystemObjectType.file, FileSystemObjectType.nothing]),
        taskEither.chain(descriptor => async (): Promise<either.Either<ConfigError[], Object>> => {
            const valuesToOverwrite: Object = {
                private: true,
                workspaces: Array.from(monorepoPackageRegistry.getRegisteredPackages().values()).map(registeredPackage => {
                    // If we don't use posix sep ('/' instead of windows '\'), then yarn + tsc can run into trouble resolving dependencies
                    return registeredPackage.relativePath
                    // replaceAll not supported by node 14 so using .split.join
                    .split('\\').join('/');
                })
            };

            if (descriptor.type === FileSystemObjectType.file) {
                const existingFileContents = (await (fs.promises.readFile(MONOREPO_PACKAGE_JSON_ABSOLUTE_PATH))).toString();
                var existingFileJSON: Object;
                try {
                    existingFileJSON = JSON.parse(existingFileContents);
                } catch(e) {
                    return either.right(valuesToOverwrite);
                }

                Object.keys(valuesToOverwrite).forEach(key => {
                    (existingFileJSON as any)[key] = (valuesToOverwrite as any)[key];
                })

                return either.right(existingFileJSON);
            } else {
                return either.right(valuesToOverwrite);
            }
        })
    );
}