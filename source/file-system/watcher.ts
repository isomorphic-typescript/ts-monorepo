import * as chokidar from 'chokidar';
import { FileSystemObjectDescriptor, getFileSystemObjectDescriptor } from './object';
interface FileWatcherHandlers {
    onExists?: (descriptor: FileSystemObjectDescriptor) => void;
    onChange?: (descriptor: FileSystemObjectDescriptor) => void;
    onRemove?: (path: string, wasDirectory: boolean) => void;
}

interface Closable {
    close: () => Promise<void>
}

export async function watch(path: string, handlers: FileWatcherHandlers): Promise<Closable> {
    const watcher = chokidar.watch(path, {followSymlinks: false});
    if (handlers.onExists) {
        const onExists = handlers.onExists;
        watcher
            .on("add", async (path, _stats) => {
                return onExists(await getFileSystemObjectDescriptor(path))
            })
            .on("addDir", async (path, _stats) => {
                return onExists(await getFileSystemObjectDescriptor(path))
            });
    }
    if (handlers.onChange) {
        const onChange = handlers.onChange;
        watcher
            .on("change", async (path, _stats) => {
                return onChange(await getFileSystemObjectDescriptor(path))
            });
    }
    if (handlers.onRemove) {
        const onRemove = handlers.onRemove;
        watcher
            .on("unlink", async path => {
                onRemove(path, false);
            })
            .on("unlinkDir", async path => {
                onRemove(path, true);
            });
    }
    watcher.on("error", error => {
        throw error;
    });
    return new Promise(resolve => {
        watcher.on("ready", () => {
            resolve({
                close: () => watcher.close()
            });
        });
    });
}