import { EdgeAnimation } from "./edge-animation";
import { NodeAnimation } from "./node-animation";

export interface GraphAnimation {
    state?: string;
    time?: number;
    nodeAnimations: NodeAnimation[];
    treeAnimations: NodeAnimation[];
    // edgeAnimations: EdgeAnimation[];
}