export declare enum ErrorType {
    InvalidScope = "InvalidScope",
    InvalidPackageName = "InvalidPackageName",
    InvalidConfig = "InvalidConfig",
    InvalidSemanticVersion = "InvalidSemanticVersion",
    InvalidDependencyVersion = "InvalidDependencyVersion",
    FileSystemObjectNotFound = "FileSystemObjectNotFound",
    SubfolderIsEmptyString = "SubfolderIsEmptyString",
    DuplicateSubfolder = "DuplicateSubfolder",
    DuplicateResolvedPackageName = "DuplicateResolvedPackageName",
    NonExistentTemplate = "NonExistentTemplate",
    CircularTemplateDependency = "CircularTemplateDependency",
    CircularTypeScriptProjectReferenceDependency = "CircularTypeScriptProjectReferenceDependency",
    ExplicitNameInPackageJsonConfig = "ExplicitNameInPackageJsonConfig",
    DuplicateDependencyInPackageJsonConfig = "DuplicateDependencyInPackageJsonConfig",
    JsonParseError = "JsonParseError",
    UnexpectedRuntimeError = "UnexpectedRuntimeError",
    UnexpectedFilesystemObject = "UnexpectedFilesystemObject",
    ExplicitlySetNonOverridableValueInTSConfigJson = "ExplicitlySetNonOverridableValueInTSConfigJson",
    UnknownPackageDependency = "UnknownPackageDependency",
    NoLeafPackages = "NoLeafPackages",
    ToolFileIsNotInDevEnv = "ToolFileIsNotInDevEnv"
}
export interface ConfigError {
    type: ErrorType;
    message: string;
}
//# sourceMappingURL=errors.d.ts.map