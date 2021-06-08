export interface ChildToParentMessage {
    type: "restart"
}

export interface ParentToChildMessage {
    type: "die"
}