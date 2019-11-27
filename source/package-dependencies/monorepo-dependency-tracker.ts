interface MonorepoPackage {
    scope: string;
    relativePath: string;
    name: string;
    monorepo: {
        dependsOn: MonorepoPackage[];
        dependencyOf: MonorepoPackage[];
    };
    npm: {
        dependencies: [string, string];
        devDependencies: [string, string];
        peerDependencies: [string, string];
        optionalDependencies: [string, string];
    };
}