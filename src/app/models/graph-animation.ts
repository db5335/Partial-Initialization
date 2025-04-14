import { EdgeAnimation } from "./edge-animation";
import { NodeAnimation } from "./node-animation";

export interface GraphAnimation {
    state?: string;
    ratio: [number, number, number];
    energy: number[];
    time?: number;
    nodeAnimations: NodeAnimation[];
    treeAnimations: NodeAnimation[];
    // edgeAnimations: EdgeAnimation[];
}