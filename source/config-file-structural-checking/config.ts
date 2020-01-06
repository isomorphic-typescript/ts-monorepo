/*
export type NodeDependency = string | [string, string];
export interface PackageJSON {
    dependencies?: NodeDependency[];
    devDependencies?: NodeDependency[];
    peerDependencies?: NodeDependency[];
    optionalDependencies?: NodeDependency[];
}

export interface TSConfigJSON {
    compilerOptions?: {};
    include?: string[];
    exclude?: string[];
    files?: string[];
}

export interface PackageConfigJunction {
    [nameSegment: string]: PackageConfigJunction | PackageConfig;
};

export function isNotJunction(packageSubtree: PackageConfigJunction | PackageConfig): packageSubtree is PackageConfig {
    return packageSubtree.package === true;
}

export interface PackageConfig {
    package: true;
    extends: string[];
    files?: {
        json?: {
            "package.json"?: PackageJSON;
            "tsconfig.json"?: TSConfigJSON;
        };
        edn?: {
            "clojure.edn"?: any; // TODO: implement Clojure plugin
        };
        toml?: {
            "cargo.toml"?: any; // TODO: implement Rust Cargo plugin
        };
        yaml?: {};
        xml?: {
            "pom.xml"?: any; // TODO: implement Java Maven plugin
            "nuget.config"?: any; // TODO: implement C# Nuget plugin
        };
        mod?: {
            "go.mod"?: any; // TODO: implement Golang Module plugin
        };
        ini?: {};
    };
    skoville?: {
        autoRestart: boolean;
        hot: boolean;
        serverAt: string;
        entry?: string;
    };
}

export default interface TSMonorepoJson {
    version: string;
    ttypescript: boolean;
    cleanBeforeCompile: boolean;
    templates: {
        [name: string]: PackageConfig;
    };
    packages: {
        [scope: string]: PackageConfigJunction
    };
}
*/