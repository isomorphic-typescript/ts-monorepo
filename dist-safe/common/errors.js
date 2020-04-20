"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorType;
(function (ErrorType) {
    ErrorType["InvalidScope"] = "InvalidScope";
    ErrorType["InvalidPackageName"] = "InvalidPackageName";
    ErrorType["InvalidConfig"] = "InvalidConfig";
    ErrorType["InvalidSemanticVersion"] = "InvalidSemanticVersion";
    ErrorType["InvalidDependencyVersion"] = "InvalidDependencyVersion";
    ErrorType["FileSystemObjectNotFound"] = "FileSystemObjectNotFound";
    ErrorType["SubfolderIsEmptyString"] = "SubfolderIsEmptyString";
    ErrorType["DuplicateSubfolder"] = "DuplicateSubfolder";
    ErrorType["DuplicateResolvedPackageName"] = "DuplicateResolvedPackageName";
    ErrorType["NonExistentTemplate"] = "NonExistentTemplate";
    ErrorType["CircularTemplateDependency"] = "CircularTemplateDependency";
    ErrorType["CircularTypeScriptProjectReferenceDependency"] = "CircularTypeScriptProjectReferenceDependency";
    ErrorType["ExplicitNameInPackageJsonConfig"] = "ExplicitNameInPackageJsonConfig";
    ErrorType["DuplicateDependencyInPackageJsonConfig"] = "DuplicateDependencyInPackageJsonConfig";
    ErrorType["JsonParseError"] = "JsonParseError";
    ErrorType["UnexpectedRuntimeError"] = "UnexpectedRuntimeError";
    ErrorType["UnexpectedFilesystemObject"] = "UnexpectedFilesystemObject";
    ErrorType["ExplicitlySetNonOverridableValueInTSConfigJson"] = "ExplicitlySetNonOverridableValueInTSConfigJson";
    ErrorType["UnknownPackageDependency"] = "UnknownPackageDependency";
    ErrorType["NoLeafPackages"] = "NoLeafPackages";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
//# sourceMappingURL=errors.js.map