import { MonorepoPackage } from "./monorepo-package";
import { NodeDependency } from "../config-file-structural-checking/config";
import { MergedPackageJson } from "../common/types";
import { ConfigError, ErrorType } from "../error";
import { colorize } from "../colorize-special-text";

export class MonoreportPackageRegistry {
    private readonly packages: Map<string, MonorepoPackage>;
    private readonly leafSet: Set<MonorepoPackage>;
    private hashOfLeafSetPackages: string;

    public constructor() {
        this.packages = new Map();
        this.leafSet = new Set();
        this.hashOfLeafSetPackages = "";
    }

    public registerPackage(mergedPackageJson: MergedPackageJson, relativePath: string): ConfigError[] {
        const packageName = mergedPackageJson.name;
        const existingPackageInRegistry = this.packages.get(packageName);
        if (existingPackageInRegistry !== undefined) {
            return [
                {
                    type: ErrorType.DuplicateResolvedPackageName,
                    message: `Attempt to register package ${colorize.package(packageName)} with version ${mergedPackageJson.version} which is already registered with version ${existingPackageInRegistry.version}.`
                }
            ];
        }
        const monorepoPackage: MonorepoPackage = {
            relativePath,
            name: mergedPackageJson.name,
            version: mergedPackageJson.version,
            monorepo: {
                dependsOn: {},
                dependencyOf: {}
            },
            npm: mergedPackageJson
        };
        this.packages.set(packageName, monorepoPackage);
        return [];
    }

    public getLeafSet() {
        const currentHashOfPackages = generateHash(Object.ofEntries(this.packages.entries()));
        if (currentHashOfPackages != this.hashOfLeafSetPackages) {
            this.leafSet.clear();
            this.resolveMonorepoDependencies();
            this.hashOfLeafSetPackages = generateHash(Object.ofEntries(this.packages.entries()));
            // Loop through each package of the registry. If its "dependencyOf" has no elements,
            // then it is a leaf package.
            for (const registeredPackage of this.packages.values()) {
                if (Object.keys(registeredPackage.monorepo.dependencyOf).length === 0) {
                    this.leafSet.add(registeredPackage);
                }
            }
        }
        return new Set(this.leafSet);
    }

    private resolveMonorepoDependencies() {
        // Clear all known information on dependencies.
        for (const registeredPackage of this.packages.values())  {
            registeredPackage.monorepo.dependsOn = {};
            registeredPackage.monorepo.dependencyOf = {};
        }
        // Loop through each package of the registry. Then loop through each of the dependencies of each package.
        // For each of a package's dependencies, if the dependency exists in registry, inspect, otherwise ignore.
        // For every dependency found in registry, update its "dependencyOf", and update package's "dependsOn".
        for (const registeredPackage of this.packages.values()) {
            const definiteDependencies: NodeDependency[] = [
                ...registeredPackage.npm.dependencies,
                ...registeredPackage.npm.devDependencies,
                ...registeredPackage.npm.optionalDependencies,
                ...registeredPackage.npm.peerDependencies
            ];
            // TODO: dedupe definite dependencies.
            for (const depdendency of definiteDependencies) {
                // The problem here is that we need to define the behavior of a NodeDependency which does
                // not give an exact version versus when it does, and in both scenarios whether this this
                // will result in an ignore when searching through the registry.
                // 1. If it is just a blank version [string] instead of [string, string],
                //    then we need to assume the user is choosing either the latest version or the monorepo
                //    version. If it is in the registry, we assume monorepo version, otherwise we assume
                //    latest version (TODO: check to see npm already has a concept of latest & use that instead)
                // 2. If it is not a blank version [string, string], then version given must match version in registry.
                const [depName, depVersion] = depdendency;
                const registeredDepdendency = this.packages.get(depName);
                if (depVersion === undefined) {
                    if (registeredDepdendency !== undefined) {
                        registeredDepdendency.monorepo.dependencyOf[registeredPackage.name] = registeredPackage;
                        registeredPackage.monorepo.dependsOn[registeredDepdendency.name] = registeredDepdendency;
                    }
                } else {
                    if (registeredDepdendency !== undefined &&
                        registeredDepdendency.version === depVersion) {
                        registeredDepdendency.monorepo.dependencyOf[registeredPackage.name] = registeredPackage;
                        registeredPackage.monorepo.dependsOn[registeredDepdendency.name] = registeredDepdendency;
                    }
                }
            }
        }
    }
}