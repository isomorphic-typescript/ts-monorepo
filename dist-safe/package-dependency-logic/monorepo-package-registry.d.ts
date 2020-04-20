import { MonorepoPackage } from "../common/types/monorepo-package";
import * as t from 'io-ts';
import { NodeDependency } from '../common/types/io-ts/config-types';
import { MergedPackageConfig } from "../common/types/merged-config";
import { ConfigError } from "../common/errors";
import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import { Success } from "../common/constants";
export declare class MonorepoPackageRegistry {
    private readonly packages;
    private readonly leafSet;
    private hashOfAllPackages;
    private timesRecalculatedHash;
    constructor();
    registerPackage(mergedPackageConfig: MergedPackageConfig, relativePath: string): either.Either<ConfigError[], Success>;
    getLeafSet(): Set<MonorepoPackage>;
    getRegisteredPackages(): Set<MonorepoPackage>;
    ensureNoCircularDependencies(): either.Either<ConfigError[], Success>;
    /**
     * Returns whether any changes were made to the internal dependency graph.
     */
    private resolveMonorepoDependencies;
    private calculatePackagesHash;
    /**
     * @returns monorepo package from registry IFF the following conditions are met:
     * 1. Package registry contains a package with given name
     * 2. Provided version value is undefined or version of package in registry "satisfies" provided defined version value according to semver.
     */
    getMonorepoPackageIfCompatibleAndPresent(reference: t.TypeOf<typeof NodeDependency>): option.Option<MonorepoPackage>;
    private md5Hash;
}
//# sourceMappingURL=monorepo-package-registry.d.ts.map