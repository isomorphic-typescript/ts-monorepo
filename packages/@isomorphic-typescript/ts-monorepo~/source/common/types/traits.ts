export interface Terminateable {
    terminate: () => Promise<void>
}