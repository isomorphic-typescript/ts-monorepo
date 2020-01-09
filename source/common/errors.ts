export enum ErrorType {
    InvalidScope = "InvalidScope",
    InvalidPackageName = "InvalidPackageName",
    InvalidConfig = "InvalidConfig",
    UndefinedConfig = "UndefinedConfig",
    FileSystemObjectNotFound = "FileSystemObjectNotFound",
    SubfolderIsEmptyString = "SubfolderIsEmptyString",
    DuplicateSubfolder = "DuplicateSubfolder",
    DuplicateResolvedPackageName = "DuplicateResolvedPackageName",
    JunctionWithPackageNameSuffix = "JunctionWithPackageNameSuffix",
    PackageNameMissingSuffix = "PackageNameMissingSuffix",
    NonExistentTemplate = "NonExistentTemplate",
    CircularTemplateDependency = "CircularTemplateDependency",
    ExplicitNameInPackageJsonConfig = "ExplicitNameInPackageJsonConfig",
    DuplicateDependencyInPackageJsonConfig = "DuplicateDependencyInPackageJsonConfig",
    JsonParseError = "JsonParseError",
    UnexpectedRuntimeError = "UnexpectedRuntimeError",
    UnexpectedFilesystemObject = "UnexpectedFilesystemObject",
    ExplicitlySetNonOverridableValueInTSConfigJson = "ExplicitlySetNonOverridableValueInTSConfigJson"
}

export interface ConfigError {
    type: ErrorType;
    message: string;
}