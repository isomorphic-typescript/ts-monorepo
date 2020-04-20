"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../common/errors");
const colorize_special_text_1 = require("../colorize-special-text");
const crypto = require("crypto");
const either = require("fp-ts/lib/Either");
const semver = require("semver");
const option = require("fp-ts/lib/Option");
const constants_1 = require("../common/constants");
const pipeable_1 = require("fp-ts/lib/pipeable");
const array = require("fp-ts/lib/Array");
class MonorepoPackageRegistry {
    constructor() {
        this.timesRecalculatedHash = 0;
        this.packages = new Map();
        this.leafSet = new Set();
        this.hashOfAllPackages = "";
    }
    registerPackage(mergedPackageConfig, relativePath) {
        const mergedPackageJson = mergedPackageConfig.files.json["package.json"];
        const packageName = mergedPackageJson.name;
        const existingPackageInRegistry = this.packages.get(packageName);
        if (existingPackageInRegistry !== undefined) {
            return either.left([{
                    type: errors_1.ErrorType.DuplicateResolvedPackageName,
                    message: `Attempt to register package ${colorize_special_text_1.colorize.package(packageName)} with version ${mergedPackageJson.version} which is already registered with version ${existingPackageInRegistry.version}.`
                }]);
        }
        const monorepoPackage = {
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
        return either.right(constants_1.SUCCESS);
    }
    getLeafSet() {
        this.resolveMonorepoDependencies();
        return new Set(this.leafSet);
    }
    getRegisteredPackages() {
        this.resolveMonorepoDependencies();
        return new Set(this.packages.values());
    }
    ensureNoCircularDependencies() {
        this.resolveMonorepoDependencies();
        // TODO: find way to support typescript project reference circular dependency since Node supports this.
        // We will use a memoized, recursive solution here.
        const knownPackagesWithCircularDependenciesOnThemSelves = new Map();
        function recursivelyDetermineIfAPackageHasACircularDependencyOnItself([packageName, monorepoPackage], dependencyChain) {
            if (knownPackagesWithCircularDependenciesOnThemSelves.has(packageName))
                return;
            const newDependencyChain = [...dependencyChain, packageName];
            if (dependencyChain.includes(packageName)) {
                const indexOfPackageName = dependencyChain.indexOf(packageName);
                knownPackagesWithCircularDependenciesOnThemSelves.set(packageName, newDependencyChain.slice(indexOfPackageName));
            }
            else {
                Object.entries(monorepoPackage.relationships.dependsOn).forEach(dependencyEntry => recursivelyDetermineIfAPackageHasACircularDependencyOnItself(dependencyEntry, newDependencyChain));
            }
        }
        Array.from(this.packages.entries())
            .forEach(packageEntry => recursivelyDetermineIfAPackageHasACircularDependencyOnItself(packageEntry, []));
        if (knownPackagesWithCircularDependenciesOnThemSelves.size > 0) {
            return pipeable_1.pipe(Array.from(knownPackagesWithCircularDependenciesOnThemSelves.entries()), array.map(([packageName, dependencyChain]) => ({
                type: errors_1.ErrorType.CircularTypeScriptProjectReferenceDependency,
                message: `The package ${colorize_special_text_1.colorize.package(packageName)} has a circular typescript project references dependency on itself via relationship graph${"\n"}${dependencyChain.map(colorize_special_text_1.colorize.package).join(" depends on\n")}`
            })), either.left);
        }
        else {
            return either.right(constants_1.SUCCESS);
        }
    }
    /**
     * Returns whether any changes were made to the internal dependency graph.
     */
    resolveMonorepoDependencies() {
        // TODO: the below 2 lines of code could be considered premature optimization. Run some heuristics to see what is preferable.
        const currentHashOfPackages = this.calculatePackagesHash();
        if (currentHashOfPackages === this.hashOfAllPackages)
            return false;
        if (this.timesRecalculatedHash > 0) {
            throw new Error(`Logical error: recalculated hash ${this.timesRecalculatedHash} times.`);
        }
        this.timesRecalculatedHash++;
        // Clear all known information on dependencies.
        for (const registeredPackage of this.packages.values()) {
            registeredPackage.relationships.dependsOn = {};
            registeredPackage.relationships.dependencyOf = {};
        }
        // Loop through each package of the registry. Then loop through each of the dependencies of each package.
        // For each of a package's dependencies, if the dependency exists in registry, inspect, otherwise ignore.
        // For every dependency found in registry, update its "dependencyOf", and update package's "dependsOn".
        for (const registeredPackage of this.packages.values()) {
            const mergedPackageJson = registeredPackage.config.files.json["package.json"];
            const definiteDependencies = [
                ...mergedPackageJson.dependencies,
                ...mergedPackageJson.devDependencies,
                ...mergedPackageJson.optionalDependencies,
                ...mergedPackageJson.peerDependencies
            ];
            const seenDefiniteDependencies = new Set();
            for (const dependency of definiteDependencies) {
                // The problem here is that we need to define the behavior of a NodeDependency which does
                // not give an exact version versus when it does, and in both scenarios whether this
                // will result in an ignore when searching through the registry.
                // 1. If it is just a blank version string instead of [string, string],
                //    then we need to assume the user is choosing either the latest version or referencing a monorepo package
                //    If the dependencyName is in the registry, we assume monorepo reference, otherwise we assume latest version
                // 2. If it is not a blank version [string, string], then we assume user wants to reference version not managed by monorepo, and
                //    thus we can use pacote to obtain the version they seek.
                const [dependencyName] = Array.isArray(dependency) ? dependency :
                    [dependency];
                if (seenDefiniteDependencies.has(dependencyName)) {
                    continue;
                }
                else {
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
    calculatePackagesHash() {
        return pipeable_1.pipe(Array.from(this.packages.entries()), array.map(([packageName, monorepoPackage]) => [
            packageName,
            Object.keys(monorepoPackage.relationships.dependsOn)
        ]), Object.fromEntries, JSON.stringify, this.md5Hash);
    }
    /**
     * @returns monorepo package from registry IFF the following conditions are met:
     * 1. Package registry contains a package with given name
     * 2. Provided version value is undefined or version of package in registry "satisfies" provided defined version value according to semver.
     */
    getMonorepoPackageIfCompatibleAndPresent(reference) {
        const [packageName, packageVersion] = Array.isArray(reference) ? reference :
            [reference, undefined]; // TODO: let's change this by using Either<Tuple2, Tuple1> instead.
        const registeredPackage = this.packages.get(packageName);
        if (registeredPackage === undefined) {
            return option.none;
        }
        else {
            if (packageVersion === undefined) {
                return option.some(registeredPackage);
            }
            else {
                if (semver.satisfies(registeredPackage.version, packageVersion)) {
                    return option.some(registeredPackage);
                }
                else {
                    return option.none;
                }
            }
        }
    }
    md5Hash(input) {
        return crypto.createHash("md5").update(input).digest("hex");
    }
}
exports.MonorepoPackageRegistry = MonorepoPackageRegistry;
//# sourceMappingURL=monorepo-package-registry.js.map