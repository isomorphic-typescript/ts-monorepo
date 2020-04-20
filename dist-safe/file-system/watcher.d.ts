import { FileSystemObjectDescriptor } from './object';
import { Terminateable } from '../common/types/traits';
interface FileWatcherHandlers {
    onExists?: (descriptor: FileSystemObjectDescriptor) => void;
    onChange?: (descriptor: FileSystemObjectDescriptor) => void;
    onRemove?: (path: string, wasDirectory: boolean) => void;
}
export declare function watch(path: string, handlers: FileWatcherHandlers): Promise<Terminateable>;
export {};
//# sourceMappingURL=watcher.d.ts.map