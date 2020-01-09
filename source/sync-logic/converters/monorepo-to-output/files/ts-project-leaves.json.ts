import * as path from 'path';
import { MonorepoPackageRegistry } from "../../../../package-dependencies/monorepo-package-registry";
import { TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_ABSOLUTE_PATH } from '../../../../common/constants';

export function monorepoPackageRegistryToTSProjectLeavesJsonOutput(monorepoPackageRegistry: MonorepoPackageRegistry): Object {
    return {
        files: [],
        references: Array.from(monorepoPackageRegistry.getLeafSet())
            .map(monorepoPackage => ({
                path: path.relative(
                    path.resolve(TYPESCRIPT_LEAF_PACKAGES_CONFIG_FILE_ABSOLUTE_PATH, '../'),
                    path.resolve(monorepoPackage.relativePath)
                )
            }))
    };
}