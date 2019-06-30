import TSMonorepoConfig from "../config-file-structural-checking/config";

export class PackageDependencyTracker {
    private static PACKAGE_REGISTRY: Map<string, PackageDependencyTracker> = new Map();

    private dependsOn: Set<string>;
    private dependedOnBy: Set<string>;

    private packageName: string;

    private packageList: string[];

    private constructor(packageName: string, configJSON: TSMonorepoConfig) {
        if (PackageDependencyTracker.PACKAGE_REGISTRY.has(packageName)) {
            throw new Error(`package ${packageName} already registered`);
        }
        this.packageList = Object.keys(configJSON.packages);
        this.packageName = packageName;
        this.dependsOn = new Set();
        this.dependedOnBy = new Set();
        PackageDependencyTracker.PACKAGE_REGISTRY.set(packageName, this);

        const descriptor = configJSON.packages[packageName]
        const packageJSON = descriptor.configs["package.json"];
        this.registerDependencies(configJSON, packageJSON.dependencies);
        this.registerDependencies(configJSON, packageJSON.devDependencies);
        this.registerDependencies(configJSON, packageJSON.peerDependencies);
    }

    private registerDependencies(configJSON: TSMonorepoConfig, dependencies?: string[]) {
        if (dependencies) {
            dependencies
                .filter(dependency => this.packageList.includes(dependency))
                .forEach(dependency => {
                    this.dependsOn.add(dependency);
                    const dependencyTacker = PackageDependencyTracker.registerPackage(dependency, configJSON);
                    dependencyTacker.dependedOnBy.add(this.packageName);
                });
        }
    }

    public static registerPackage(packageName: string, configJSON: TSMonorepoConfig): PackageDependencyTracker {
        if (!Object.keys(configJSON.packages).includes(packageName)) {
            throw new Error(`Trying to register package '${packageName}', which is not a member of the packages object in the config.`);
        }
        const packageDependencyTracker = this.PACKAGE_REGISTRY.get(packageName);
        if (packageDependencyTracker) {
            return packageDependencyTracker;
        } else {
            return new PackageDependencyTracker(packageName, configJSON);
        }
    }

    public static getLeafSet() {
        const leafSet = new Set<string>();
        Array
            .from(this.PACKAGE_REGISTRY.entries())
            .forEach(([packageName, dependencyTracker]) => {
                if (dependencyTracker.dependedOnBy.size === 0) {
                    leafSet.add(packageName);
                }
            });
        return leafSet;
    }

    public static getDependenciesOf(packageName: string) {
        const dependencyTacker = this.PACKAGE_REGISTRY.get(packageName);
        if (!dependencyTacker) throw new Error(`No package registered with name '${packageName}'`);
        return new Set(dependencyTacker.dependsOn); // clone the set so as to not expose internal state.
    }
}