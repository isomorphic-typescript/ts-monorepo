import { MonorepoPackageRegistry } from "../../../../package-dependencies/monorepo-package-registry";

export function monorepoPackageRegistryToTSProjectLeavesJsonOutput(monorepoPackageRegistry: MonorepoPackageRegistry): Object {
    return {
        files: [],
        references: Array.from(monorepoPackageRegistry.getLeafSet())
            .map(monorepoPackage => ({
                path: monorepoPackage.relativePath
            }))
    };
}