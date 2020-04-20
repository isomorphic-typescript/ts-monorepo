import * as fs from 'fs';

export enum FileSystemObjectType {
    nothing = "nothing",
    file = "file",
    directory = "directory",
    symlink = "symlink"
}

export type FileSystemObjectDescriptor = {
    path: string;
    type: FileSystemObjectType.nothing | FileSystemObjectType.file | FileSystemObjectType.directory;
} | {
    path: string;
    type: FileSystemObjectType.symlink;
    destination: FileSystemObjectDescriptor;
    traversedPath: string;
    traversedType: FileSystemObjectType.nothing | FileSystemObjectType.file | FileSystemObjectType.directory;
}

export async function getFileSystemObjectDescriptor(path: string): Promise<FileSystemObjectDescriptor> {
    const stats = await (async function() {
        try {
            return await fs.promises.lstat(path);
        } catch(e) {
            return undefined;
        }
    })();
    if (stats === undefined) {
        return {
            path,
            type: FileSystemObjectType.nothing
        };
    } else {
        if(stats.isSymbolicLink()) {
            const destination = await getFileSystemObjectDescriptor(await fs.promises.readlink(path));
            return {
                path,
                type: FileSystemObjectType.symlink,
                destination,
                traversedPath: destination.type === FileSystemObjectType.symlink ? destination.traversedPath : destination.path,
                traversedType: destination.type === FileSystemObjectType.symlink ? destination.traversedType : destination.type
            };
        } else {
            return {
                path,
                type: stats.isDirectory() ? FileSystemObjectType.directory : FileSystemObjectType.file
            };
        }
    }
}