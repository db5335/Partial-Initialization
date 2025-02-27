import { Delaunay } from "d3-delaunay";
import Graph from "graphology";

export interface GraphLevel {
    graph: Graph;
    adjacencies: Delaunay<unknown>;
}