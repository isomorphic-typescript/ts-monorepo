import { MonorepoPackage } from "../common/types/monorepo-package";
import * as t from 'io-ts';
import { NodeDependency } from '../config-file-structural-checking/io-ts-trial';
import { MergedPackageConfig } from "../common/types/merged-config";
import { ConfigError, ErrorType } from "../common/errors";
import { colorize } from "../colorize-special-text";
import * as crypto from 'crypto';
import * as either from 'fp-ts/lib/Either';
import { Success, SUCCESS } from "../common/constants";

export class MonorepoPackageRegistry {
    private readonly packages: Map<string, MonorepoPackage>;
    private readonly leafSet: Set<MonorepoPackage>;
    private hashOfAllPackages: string;

    public constructor() {
        this.packages = new Map();
        this.leafSet = new Set();
        this.hashOfAllPackages = "";
    }

    public registerPackage(mergedPackageConfig: MergedPackageConfig, relativePath: string): either.Either<ConfigError[], Success> {
        const mergedPackageJson = mergedPackageConfig.files.json["package.json"];
        const packageName = mergedPackageJson.name;
        const existingPackageInRegistry = this.packages.get(packageName);
        if (existingPackageInRegistry !== undefined) {
            return either.left([{
                type: ErrorType.DuplicateResolvedPackageName,
                message: `Attempt to register package ${colorize.package(packageName)} with version ${mergedPackageJson.version} which is already registered with version ${existingPackageInRegistry.version}.`
            }]);
        }
        const monorepoPackage: MonorepoPackage = {
            relativePath,
            name: mergedPackageJson.name,
            version: mergedPackageJson.version,
            relationships: {
                dependsOn: {},
                dependencyOf: {}
            },
            config: mergedPackageConfig
        };
        this.packages.set(packageName, monorepoPackage);
        return either.right(SUCCESS);
    }

    public getLeafSet() {
        this.resolveMonorepoDependencies()
        return new Set(this.leafSet);
    }

    public getRegisteredPackages() {
        this.resolveMonorepoDependencies();
        return new Set(this.packages.values());
    }

    /**
     * Returns whether any changes were made to the internal dependency graph.
     */
    private resolveMonorepoDependencies(): boolean {
        // TODO: the below 2 lines of code could be considered premature optimization. Run some heuristics to see what is preferable.
        const currentHashOfPackages = this.md5Hash(JSON.stringify(Object.fromEntries(this.packages.entries())));
        if (currentHashOfPackages === this.hashOfAllPackages) return false;
        // Clear all known information on dependencies.
        for (const registeredPackage of this.packages.values())  {
            registeredPackage.relationships.dependsOn = {};
            registeredPackage.relationships.dependencyOf = {};
        }
        // Loop through each package of the registry. Then loop through each of the dependencies of each package.
        // For each of a package's dependencies, if the dependency exists in registry, inspect, otherwise ignore.
        // For every dependency found in registry, update its "dependencyOf", and update package's "dependsOn".
        for (const registeredPackage of this.packages.values()) {
            const mergedPackageJson = registeredPackage.config.files.json["package.json"];
            const definiteDependencies: t.TypeOf<typeof NodeDependency>[] = [
                ...mergedPackageJson.dependencies,
                ...mergedPackageJson.devDependencies,
                ...mergedPackageJson.optionalDependencies,
                ...mergedPackageJson.peerDependencies
            ];
            const seenDefiniteDependencies = new Set<string>();
            for (const dependency of definiteDependencies) {
                // The problem here is that we need to define the behavior of a NodeDependency which does
                // not give an exact version versus when it does, and in both scenarios whether this this
                // will result in an ignore when searching through the registry.
                // 1. If it is just a blank version [string] instead of [string, string],
                //    then we need to assume the user is choosing either the latest version or the relationships
                //    version. If it is in the registry, we assume relationships version, otherwise we assume
                //    latest version (TODO: check to see npm already has a concept of latest & use that instead)
                // 2. If it is not a blank version [string, string], then version given must match version in registry.
                const [dependencyName] = 
                    Array.isArray(dependency) ? dependency:
                    [dependency];
                if (seenDefiniteDependencies.has(dependencyName)) {
                    continue;
                } else {
                    seenDefiniteDependencies.add(dependencyName);
                }
                const registeredDepdendency = this.getMonorepoPackageIfPresent(dependency);
                if (registeredDepdendency !== undefined) {
                    registeredDepdendency.relationships.dependencyOf[registeredPackage.name] = registeredPackage;
                    registeredPackage.relationships.dependsOn[registeredDepdendency.name] = registeredDepdendency;
                }
            }
        }
        this.hashOfAllPackages = this.md5Hash(JSON.stringify(Object.fromEntries(this.packages.entries())));
        this.leafSet.clear();
        // Loop through each package of the registry. If its "dependencyOf" has no elements,
        // then it is a leaf package.
        for (const registeredPackage of this.packages.values()) {
            if (Object.keys(registeredPackage.relationships.dependencyOf).length === 0) {
                this.leafSet.add(registeredPackage);
            }
        }
        return true;
    }

    /**
     * @returns undefined if the given node dependency doesn't correspond to an entry. If the node dependency's version is undefined, and the package name is present, then certainly a MonorepoPackage
     * will be returned, however if the version is defined and it isn't equal to the version for the package registered, false will be returned.
     */
    public getMonorepoPackageIfPresent(reference: t.TypeOf<typeof NodeDependency>): MonorepoPackage | undefined {
        const [packageName, packageVersion] = 
            Array.isArray(reference) ? reference :
            [reference, undefined]; // TODO: let's change this by using Either<Tuple2, Tuple1> instead.
        const registeredPackage = this.packages.get(packageName);
        return registeredPackage === undefined ? registeredPackage :
            registeredPackage.version === packageVersion || packageVersion === undefined ? registeredPackage : // TODO: should we use compatible versioning rather than strict equality of version?
            undefined;
    }

    public printPackages() {
        console.log(this.hashOfAllPackages);
        console.log(this.packages);
    }

    private md5Hash(input: string): string {
        return crypto.createHash("md5").update(input).digest("hex");
    }
}