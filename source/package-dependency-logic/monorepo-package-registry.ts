import { MonorepoPackage } from "../common/types/monorepo-package";
import * as t from 'io-ts';
import { NodeDependency } from '../common/types/io-ts/config-types';
import { MergedPackageConfig } from "../common/types/merged-config";
import { ConfigError, ErrorType } from "../common/errors";
import { colorize } from "../colorize-special-text";
import * as crypto from 'crypto';
import * as either from 'fp-ts/lib/Either';
import * as semver from 'semver';
import * as option from 'fp-ts/lib/Option';
import { Success, SUCCESS } from "../common/constants";
import { pipe } from "fp-ts/lib/pipeable";
import * as array from 'fp-ts/lib/Array';

export class MonorepoPackageRegistry {
    private readonly packages: Map<string, MonorepoPackage>;
    private readonly leafSet: Set<MonorepoPackage>;
    private hashOfAllPackages: string;
    private timesRecalculatedHash = 0;

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
                message: `Attempt to register package ${colorize.package(packageName)} with version ${mergedPackageJson.version
                } which is already registered with version ${existingPackageInRegistry.version}.`
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
        this.resolveMonorepoDependencies();
        return new Set(this.leafSet);
    }

    public getRegisteredPackages() {
        this.resolveMonorepoDependencies();
        return new Set(this.packages.values());
    }
    public ensureNoCircularDependencies(): either.Either<ConfigError[], Success> {
        this.resolveMonorepoDependencies();
        // TODO: find way to support typescript project reference circular dependency since Node supports this.
        // We will use a memoized, recursive solution here.
        const knownPackagesWithCircularDependenciesOnThemSelves = new Map<string, string[]>();
        function recursivelyDetermineIfAPackageHasACircularDependencyOnItself([packageName, monorepoPackage]: [string, MonorepoPackage], dependencyChain: string[]) {
            if (knownPackagesWithCircularDependenciesOnThemSelves.has(packageName)) return;
            const newDependencyChain = [...dependencyChain, packageName];
            if (dependencyChain.includes(packageName)) {
                const indexOfPackageName = dependencyChain.indexOf(packageName);
                knownPackagesWithCircularDependenciesOnThemSelves.set(packageName, newDependencyChain.slice(indexOfPackageName));
            } else {
                Object.entries(monorepoPackage.relationships.dependsOn).forEach(dependencyEntry =>
                    recursivelyDetermineIfAPackageHasACircularDependencyOnItself(dependencyEntry, newDependencyChain));
            }
        }
        Array.from(this.packages.entries())
            .forEach(packageEntry => recursivelyDetermineIfAPackageHasACircularDependencyOnItself(packageEntry, []));
        if (knownPackagesWithCircularDependenciesOnThemSelves.size > 0) {
            return pipe(
                Array.from(knownPackagesWithCircularDependenciesOnThemSelves.entries()),
                array.map(([packageName, dependencyChain]) => ({
                    type: ErrorType.CircularTypeScriptProjectReferenceDependency,
                    message: `The package ${colorize.package(packageName)} has a circular typescript project references dependency on itself via relationship graph${
                    "\n"}${dependencyChain.map(colorize.package).join(" depends on\n")}`
                })),
                either.left
            );
        } else {
            return either.right(SUCCESS);
        }
    }

    /**
     * Returns whether any changes were made to the internal dependency graph.
     */
    private resolveMonorepoDependencies(): boolean {
        // TODO: the below 2 lines of code could be considered premature optimization. Run some heuristics to see what is preferable.
        const currentHashOfPackages = this.calculatePackagesHash();
        if (currentHashOfPackages === this.hashOfAllPackages) return false;
        if (this.timesRecalculatedHash > 0) {
            throw new Error(`Logical error: recalculated hash ${this.timesRecalculatedHash} times.`);
        }
        this.timesRecalculatedHash++;
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
                // not give an exact version versus when it does, and in both scenarios whether this
                // will result in an ignore when searching through the registry.
                // 1. If it is just a blank version string instead of [string, string],
                //    then we need to assume the user is choosing either the latest version or referencing a monorepo package
                //    If the dependencyName is in the registry, we assume monorepo reference, otherwise we assume latest version
                // 2. If it is not a blank version [string, string], then we assume user wants to reference version not managed by monorepo, and
                //    thus we can use pacote to obtain the version they seek.
                const [dependencyName] = 
                    Array.isArray(dependency) ? dependency:
                    [dependency];
                if (seenDefiniteDependencies.has(dependencyName)) {
                    continue;
                } else {
                    seenDefiniteDependencies.add(dependencyName);
                }
                const maybeRegisteredDepdendency = this.getMonorepoPackageIfCompatibleAndPresent(dependency);
                if (option.isSome(maybeRegisteredDepdendency)) {
                    const registeredDependency = maybeRegisteredDepdendency.value;
                    registeredDependency.relationships.dependencyOf[registeredPackage.name] = registeredPackage;
                    registeredPackage.relationships.dependsOn[registeredDependency.name] = registeredDependency;
                }
            }
        }
        this.hashOfAllPackages = this.calculatePackagesHash();
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

    private calculatePackagesHash() {
        return pipe(
            Array.from(this.packages.entries()),
            array.map(([packageName, monorepoPackage]) => [
                packageName,
                Object.keys(monorepoPackage.relationships.dependsOn)
            ]),
            Object.fromEntries,
            JSON.stringify,
            this.md5Hash
        );
    }

    /**
     * @returns monorepo package from registry IFF the following conditions are met:
     * 1. Package registry contains a package with given name
     * 2. Provided version value is undefined or version of package in registry "satisfies" provided defined version value according to semver.
     */
    public getMonorepoPackageIfCompatibleAndPresent(reference: t.TypeOf<typeof NodeDependency>): option.Option<MonorepoPackage> {
        const [packageName, packageVersion] = 
            Array.isArray(reference) ? reference :
            [reference, undefined]; // TODO: let's change this by using Either<Tuple2, Tuple1> instead.
        const registeredPackage = this.packages.get(packageName);
        if (registeredPackage === undefined) {
            return option.none;
        } else {
            if (packageVersion === undefined) {
                return option.some(registeredPackage);
            } else {
                if (semver.satisfies(registeredPackage.version, packageVersion)) {
                    return option.some(registeredPackage);
                } else {
                    return option.none;
                }
            }
        }
    }
    private md5Hash(input: string): string {
        return crypto.createHash("md5").update(input).digest("hex");
    }
}