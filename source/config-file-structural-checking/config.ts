export interface PackageJSON {
    dependencies?: string[];
    devDependencies?: string[];
    peerDependencies?: string[];
}

export interface TSConfigJSON {
    compilerOptions?: {
        outDir?: string;
    }
}

export interface ProjectDescriptor {
    publishDistributionFolder: boolean;
    configs: {
        "package.json": PackageJSON;
        "tsconfig.json": TSConfigJSON;
    }
}

/**
 * @alias testing
 */
export default interface TSMonorepoConfig {
    version: string;
    packageRoot: string;
    baseConfigs: {
        "package.json": PackageJSON;
        "tsconfig.json": TSConfigJSON;
    };
    packages: {[packageName: string]: ProjectDescriptor};
}