export enum ErrorType {
    InvalidScope = "InvalidScope",
    InvalidPackageName = "InvalidPackageName",
    FileSystemObjectNotFound = "FileSystemObjectNotFound",
    SubfolderIsEmptyString = "SubfolderIsEmptyString",
    DuplicateSubfolder = "DuplicateSubfolder",
    DuplicateResolvedPackageName = "DuplicateResolvedPackageName",
    JunctionWithPackageNameSuffix = "JunctionWithPackageNameSuffix",
    PackageNameMissingSuffix = "PackageNameMissingSuffix"
}

export interface ConfigError {
    type: ErrorType;
    message: string;
}