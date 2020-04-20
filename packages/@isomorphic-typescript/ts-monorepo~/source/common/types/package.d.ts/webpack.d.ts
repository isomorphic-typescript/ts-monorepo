// TODO: add types for webpack 5

import webpack = require("webpack");

export interface Asset {
    info: {
        size: number;
    };
    source: {
        _size: number;
    };
    name: string;
}

export interface ModuleDependency {
    type: string;
}

export interface NormalModule {
    dependencies: ModuleDependency[];
    debugId: number;
    request: string;
    userRequest: string;
    rawRequest: string;
}

export interface ModuleGraphConnection {
    originModule: NormalModule | null;
    resolvedOriginModule: NormalModule | null;
    dependency: ModuleDependency;
    resolvedModule: NormalModule;
    module: NormalModule;
    weak: boolean;
    conditional: boolean;
}

export interface WebpackCompilation {
    getAssets(): Asset[];
}

export interface CompilationModule {
    dependencies: any; // object
    blocks: any; // object
    type: string;
    context: string;
    needId: boolean;
    debugId: number;
    resolveOptions: any; // object
    factoryMeta?: any;
    _warnings?: any;
    _errors?: any; // object
    buildMeta: any; // object
    buildInfo: any; // object
    presentationalDependencies?: any;
}

export interface CompilationDirectModule extends CompilationModule {
    name: string;
    stage: number;
    compilation: webpack.compilation.Compilation;
    chunk: any; // object
    _cachedCeneratedCode: string;
}

export interface FinalModule extends CompilationModule {
    request: string;
    userRequest: string;
    rawRequest: string;
    binary: boolean;
    parser: any; // object
    generator: any; // object
    resource: string;
    matchResource?: any;
    loaders: any; // object
    error: any; // object
    _source: any; // object
    _sourceSizes?: any;
    _cachedCodeGenerationHash: string;
    _cachedCodeGeneration: any; // object
    _lastSuccessfulBuildMeta: any; // object
    _forceBuild: boolean;
    useSourceMap: boolean;
    _ast: any; // object
}

export interface SourceLocation {
    line: number;
    column: number;
}

export interface SourceRange {
    start: SourceLocation;
    end?: SourceLocation;
}

export interface CompilationError {
    details?: any;
    module: FinalModule;
    loc: SourceRange;
    hideStack?: any;
    chunk?: any;
    file?: any;
    name: string;
    error: any;
}