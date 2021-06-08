import * as path from 'path';
import { MonorepoPackageRegistry } from "../../../../package-dependency-logic/monorepo-package-registry";
import { TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_ABSOLUTE_PATH } from '../../../../common/constants';

// TODO: how can we handle circular references? Should we before the following is solved? https://github.com/microsoft/TypeScript/issues/33685
export function monorepoPackageRegistryToTSProjectLeavesJsonOutput(monorepoPackageRegistry: MonorepoPackageRegistry): Object {
    return {
        files: [],
        references: Array.from(monorepoPackageRegistry.getLeafSet())
            .map(monorepoPackage => ({
                path: path.relative(
                    path.resolve(TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_ABSOLUTE_PATH, '../'),
                    path.resolve(monorepoPackage.relativePath)
                )
                // If we don't use posix sep ('/' instead of windows '\'), then yarn + tsc can run into trouble resolving dependencies
                // replaceAll not supported by node 14 so using .split.join
                .split('\\').join('/')
            }))
    };
}