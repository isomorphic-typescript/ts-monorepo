export interface PackageJSON {
    dependencies?: string[];
    devDependencies?: string[];
    peerDependencies?: string[];
}

export interface TSConfigJSON {

}

export interface ProjectDescriptor {
    configs: {
        "package.json": PackageJSON;
        "tsconfig.json": TSConfigJSON;
    }
}

export default interface TSMonorepoConfig {
    version: string;
    packageRoot: string;
    baseConfigs: {
        "package.json": PackageJSON;
        "tsconfig.json": TSConfigJSON;
    };
    packages: {[packageName: string]: ProjectDescriptor};
}