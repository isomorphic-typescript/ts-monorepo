export declare enum FileSystemObjectType {
    nothing = "nothing",
    file = "file",
    directory = "directory",
    symlink = "symlink"
}
export declare type FileSystemObjectDescriptor = {
    path: string;
    type: FileSystemObjectType.nothing | FileSystemObjectType.file | FileSystemObjectType.directory;
} | {
    path: string;
    type: FileSystemObjectType.symlink;
    destination: FileSystemObjectDescriptor;
    traversedPath: string;
    traversedType: FileSystemObjectType.nothing | FileSystemObjectType.file | FileSystemObjectType.directory;
};
export declare function getFileSystemObjectDescriptor(path: string): Promise<FileSystemObjectDescriptor>;
//# sourceMappingURL=object.d.ts.map