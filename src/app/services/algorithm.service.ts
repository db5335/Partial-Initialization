import { Injectable } from '@angular/core';
import Graph from 'graphology';
import { GraphAnimation } from '../models/graph-animation';
import { NodeAnimation } from '../models/node-animation';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {

  readonly LISTEN_COLOR = 'yellow';
  readonly SEND_COLOR = 'blue';
  readonly SUCCESS_COLOR = 'blue';
  readonly COLLISION_COLOR = 'red';

  readonly DEFAULT_SIZE = 6;
  readonly FOCUS_SIZE = 8

  readonly numNodes = 512;
  readonly treeNodes = 127;
  readonly f = [2, 4, 32];
  readonly g = [64, 16, 1];

  #nodeColors: string[] = [];
  #nodeLabels: string[] = [];
  #nodeSizes: number[] = [];
  #treeColors: string[] = [];
  #treeLabels: string[] = [];
  #treeSizes: number[] = [];

  #treeReset: NodeAnimation[] = [];
  #graphReset: NodeAnimation[] = [];

  constructor() { }

  createBinaryTree(tree: Graph): void {
    const numLevels = 7;

    let count = 1;
    for (let i = 0; i < numLevels; i++) {
      for (let j = 0; j < 2 ** i; j++) {
        tree.addNode(`${count++}`, { x: (j - 2 ** (i - 1)) * 500 / 2 ** i + 500 / 2 ** (i + 1), y: 50 * (numLevels - i), size: 6, color: 'lightgray' })
      }
    }

    for (let i = 1; i < 2 ** (numLevels - 1); i++) {
      tree.addEdge(`${i}`, `${2 * i}`);
      tree.addEdge(`${i}`, `${2 * i + 1}`);
    }
  }

  createNetwork(graph: Graph): void {
    const positions: [number, number][] = [];

    for (let i = 0; i < this.numNodes; i++) {
      let x = 1000 * Math.random() - 500;
      let y = 1000 * Math.random() - 500;
      while (x ** 2 + y ** 2 >= 500 ** 2 || positions.filter(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 <= 500).length > 0) {
        x = 1000 * Math.random() - 500;
        y = 1000 * Math.random() - 500;
      }

      graph.addNode(`${i}`, { x, y, size: 6, color: 'lightgray' })
      positions.push([x, y]);
    }
  }

  initialize(graph: Graph, tree: Graph): GraphAnimation[] {
    const animations: GraphAnimation[] = [];
    // animations.push({ nodeAnimations: [], treeAnimations: [] })

    for (let i = 0; i < this.treeNodes; i++) {
      this.#treeColors.push('lightgray');
    }

    for (let i = 0; i < this.numNodes; i++) {
      this.#nodeColors.push('lightgray');
    }

    const bins = [];
    for (let i = 0; i < this.numNodes; i++) {
      bins.push(Math.floor(this.numNodes * Math.random()))
      // bins.push(i);
      // bins.push(200);
    }

    // bins[0] = 301;
    // bins[2] = 302;
    // bins[3] = 303;
    // bins[4] = 304;
    // bins[5] = 305;
    // bins[6] = 306;
    // bins[7] = 307;
    // bins[8] = 308;
    // bins[9] = 309;

    // bins[1] = 10;

    let groups = [];
    for (let i = 0; i < this.numNodes; i++) {
      groups.push(-1);
    }
    for (let i = 0; i < 3; i++) {
      const newGroups = [];
      for (let j = 0; j < this.numNodes; j++) {
        newGroups.push(-1);
      }
      for (let j = 0; j < this.g[i]; j++) {
        if (i == 0) {
          animations.push(...this.mergeBins(graph, tree, j, bins, groups));
        } else {
          animations.push(...this.mergeGroups(graph, tree, i, j, groups, newGroups));
        }
      }
      if (i > 0) {
        groups = newGroups;
        console.log(newGroups.filter(i => i != -1).length)
      }
      // this.#nodeColors.push(['gray', 'gray', Math.random()]);
      // this.#edgeColors.push([]);
      // const neighbors = graph.getNodeAttribute(`${u}`, NEIGHBORS);
      // for (let v = 0; v < n; v++) {
      //   this.#edgeColors[u].push(null);
      // }
      // for (let v of neighbors) {
      //   if (v > u) {
      //     this.#edgeColors[u][v] = [0, 'lightgray', Math.random()];
      //   }
      // }
    }

    animations.push({ nodeAnimations: [], treeAnimations: [] })
    return animations;
  }

  mergeBins(graph: Graph, tree: Graph, i: number, bins: number[], groups: number[]): GraphAnimation[] {
    const animations: GraphAnimation[] = [];
    const nodeAnimations: NodeAnimation[] = [];
    const treeAnimations: NodeAnimation[] = [];
    animations.push({nodeAnimations, treeAnimations})

    this.#resetTree(treeAnimations);
    this.#resetGraph(nodeAnimations);

    treeAnimations.push({
      node: 64 + i,
      from: this.#treeColors[63 + i],
      to: "blue"
    });
    this.#treeColors[63 + i] = 'blue';
    this.#treeReset.push({
      node: 64 + i,
      from: 'blue',
      to: 'lightgray',
      // fromSize: 6,
      // toSize: 10
    });

    const initialized = [];
    for (let j = 0; j < 8; j++) {
      const nodes: number[] = [];

      for (let k = 0; k < this.numNodes; k++) {
        if (bins[k] == 8 * i + j) {
          nodes.push(k);
        }
      }

      for (const k of nodes) {
        let color = this.COLLISION_COLOR;
        if (nodes.length == 1) {
          color = this.SUCCESS_COLOR;
          initialized.push(k);
        }
        nodeAnimations.push({
          node: k,
          from: this.#nodeColors[k],
          to: color,
          fromSize: this.DEFAULT_SIZE,
          toSize: this.FOCUS_SIZE
        });
        this.#nodeColors[k] = color;
        this.#graphReset.push({
          node: k,
          from: color,
          to: 'lightgray',
          fromSize: this.FOCUS_SIZE,
          toSize: this.DEFAULT_SIZE
        });
      }
    }

    let count = 1;
    if (initialized.length > 1) {
      for (const j of initialized) {
        groups[j] = i;
        graph.updateNodeAttribute(`${j}`, 'id', _ => count++);
        graph.updateNodeAttribute(`${j}`, 'count', _ => initialized.length);
        graph.updateNodeAttribute(`${j}`, 'childCount', _ => i % 2 == 0 ? initialized.length : 0);
        // console.log(graph.getNodeAttribute(`${i}`, 'id'))
      }
    }

    return animations;
  }

  mergeGroups(graph: Graph, tree: Graph, level: number, i: number, groups: number[], newGroups: number[]): GraphAnimation[] {
    const animations: GraphAnimation[] = [];

    const root = this.g[level] + i;
    const vertices = [root];
    let pointer = 1;
    while (vertices.length < 2 ** this.f[level - 1] - 1) {
      const v = vertices[vertices.length - pointer];
      vertices.unshift(2 * v, 2 * v + 1);
      pointer++;
    }

    const offsets = [undefined, 32, 8];
    const responsible: string[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      if (i < vertices.length / 2) {
        const leftGroup = 2 * (v - offsets[level]!);
        const rightGroup = leftGroup + 1;
        if (level == 2) console.log(leftGroup, rightGroup);
        const leftNode = graph.nodes().filter(n => groups[+n] === leftGroup && graph.getNodeAttribute(n, 'id') === 1)[0];
        const rightNode = graph.nodes().filter(n => groups[+n] === rightGroup && graph.getNodeAttribute(n, 'id') === 1)[0];
        // console.log(graph.nodes().filter(n => groups[+n] === leftGroup));
        // console.log(graph.nodes().filter(n => groups[+n] === leftGroup).map(k => +k));
        // console.log(graph.nodes().filter(n => groups[+n] === leftGroup).map(k => graph.getNodeAttribute(k, 'id')));
        responsible.push(leftNode);
        responsible.push(rightNode);
        responsible.push(leftNode ?? rightNode);
      } else {
        const leftChild = 2 * v;
        const rightChild = leftChild + 1;
        const leftIndex = vertices.indexOf(leftChild);
        const rightIndex = vertices.indexOf(rightChild);
        const leftGroup = groups[+responsible[3 * leftIndex + 2]];
        const rightGroup = groups[+responsible[3 * rightIndex + 2]];
        // const id = Math.floor(Math.log2(vertices.length + 1) - Math.log2(i + 1 - (vertices.length) / 2)) + 1;
        const id = Math.floor(Math.log2(vertices.length + 1) - Math.log2(vertices.length - i + 1)) + 1;
        console.log(leftChild, rightChild, leftIndex, rightIndex, leftGroup, rightGroup, id);
        const leftNode = graph.nodes().filter(n => groups[+n] === leftGroup && graph.getNodeAttribute(n, 'id') === id)[0];
        const rightNode = graph.nodes().filter(n => groups[+n] === rightGroup && graph.getNodeAttribute(n, 'id') === id)[0];
        responsible.push(leftNode);
        responsible.push(rightNode);
        responsible.push(leftNode ?? rightNode);
      }
    }
    for (let i = vertices.length - 1; i >= 0; i--) {
      responsible.push(responsible[3 * i + 2]);
    }


    console.log(groups)
    console.log(responsible);

    let count = 0;
    let total = 0;
    for (const j of vertices) {
      let nodeAnimations: NodeAnimation[] = [];
      let treeAnimations: NodeAnimation[] = [];
      const leftCount = responsible[count] ? graph.getNodeAttribute(responsible[count], 'count') : 0;
      const rightCount = responsible[count + 1] ? graph.getNodeAttribute(responsible[count + 1], 'count') : 0;
      const totalCount = leftCount + rightCount;
      total = totalCount;
      animations.push({state: `Left Count: ${leftCount}`, nodeAnimations, treeAnimations});

      this.#resetTree(treeAnimations);
      this.#resetGraph(nodeAnimations);

      treeAnimations.push({
        node: j,
        from: this.#treeColors[j - 1],
        to: "blue"
      });
      this.#treeColors[j - 1] = 'blue';

      const left = +responsible[count];
      const right = +responsible[count + 1];
      if (!Number.isNaN(left)) {
        nodeAnimations.push({
          node: left,
          from: this.#nodeColors[left],
          to: this.SEND_COLOR,
          fromSize: this.#nodeSizes[left],
          toSize: this.FOCUS_SIZE
        });
        this.#nodeColors[left] = this.SEND_COLOR;
        this.#nodeSizes[left] = this.FOCUS_SIZE;
      }
      if (!Number.isNaN(right)) {
        nodeAnimations.push({
          node: right,
          from: this.#nodeColors[right],
          to: this.LISTEN_COLOR,
          fromSize: this.#nodeSizes[right],
          toSize: this.FOCUS_SIZE
        });
        this.#nodeColors[right] = this.LISTEN_COLOR;
        this.#nodeSizes[right] = this.FOCUS_SIZE;
      }

      nodeAnimations = [];
      treeAnimations = [];
      animations.push({state: `Right Count: ${rightCount}`, nodeAnimations, treeAnimations})
      this.#resetGraph(nodeAnimations);

      if (!Number.isNaN(left)) {
        nodeAnimations.push({
          node: left,
          from: this.#nodeColors[left],
          to: this.LISTEN_COLOR,
          fromSize: this.#nodeSizes[left],
          toSize: this.FOCUS_SIZE
        });
        this.#nodeColors[left] = this.LISTEN_COLOR;
        this.#nodeSizes[left] = this.FOCUS_SIZE;
      }
      if (!Number.isNaN(right)) {
        nodeAnimations.push({
          node: right,
          from: this.#nodeColors[right],
          to: this.SEND_COLOR,
          fromSize: this.#nodeSizes[right],
          toSize: this.FOCUS_SIZE
        });
        this.#nodeColors[right] = this.SEND_COLOR;
        this.#nodeSizes[right] = this.FOCUS_SIZE;
      }

      nodeAnimations = [];
      treeAnimations = [];
      animations.push({state: `Total Count: ${totalCount}`, nodeAnimations, treeAnimations})
      this.#resetGraph(nodeAnimations);

      const current = !Number.isNaN(left) ? left : !Number.isNaN(right) ? right : undefined;
      // const parent = responsible[count + 3]
      if (current != null) {
        nodeAnimations.push({
          node: current,
          from: this.#nodeColors[current],
          to: this.SEND_COLOR,
          fromSize: this.#nodeSizes[current],
          toSize: this.FOCUS_SIZE
        });
        this.#nodeColors[current] = this.SEND_COLOR;
        this.#nodeSizes[current] = this.FOCUS_SIZE;
        if (current != right && !Number.isNaN(right)) {
          nodeAnimations.push({
            node: right,
            from: this.#nodeColors[right],
            to: 'lightgray',
            fromSize: this.#nodeSizes[right],
            toSize: this.DEFAULT_SIZE
          });
          this.#nodeColors[right] = 'lightgray';
          this.#nodeSizes[right] = this.DEFAULT_SIZE;
        }
        if (current == right) {
          console.log(
            'abc'
          )
          graph.updateNodeAttribute(`${current}`, 'childCount', _ => 0)
        }
      }

      if (vertices[vertices.length - 1] != j) {
        const parent = Math.floor(j / 2);
        const parentIndex = vertices.indexOf(parent);
        const leftGroup = left != null ? groups[left] : undefined;
        const rightGroup = right != null ? groups[right] : undefined;
        const id = Math.floor(Math.log2(vertices.length + 1) - Math.log2(vertices.length - parentIndex + 1)) + 1;
        // console.log(leftChild, rightChild, leftIndex, rightIndex, leftGroup, rightGroup, id);
        const leftNode = graph.nodes().filter(n => groups[+n] === leftGroup && graph.getNodeAttribute(n, 'id') === id)[0];
        const rightNode = graph.nodes().filter(n => groups[+n] === rightGroup && graph.getNodeAttribute(n, 'id') === id)[0];
        console.log(left, right, leftGroup, rightGroup, id, leftNode, rightNode)
        if (leftGroup != null && leftNode != null) {
          graph.updateNodeAttribute(leftNode, 'count', _ => totalCount)
          console.log('cc', totalCount, leftNode)
          graph.updateNodeAttribute(leftNode, 'childCount', _ => totalCount)
          nodeAnimations.push({
            node: +leftNode,
            from: this.#nodeColors[+leftNode],
            to: this.LISTEN_COLOR,
            fromSize: this.#nodeSizes[+leftNode],
            toSize: this.FOCUS_SIZE
          });
          this.#nodeColors[+leftNode] = this.LISTEN_COLOR;
          this.#nodeSizes[+leftNode] = this.FOCUS_SIZE;
          this.#graphReset.push({
            node: +leftNode,
            from: this.#nodeColors[+leftNode],
            to: 'lightgray',
            fromSize: this.#nodeSizes[+leftNode],
            toSize: this.DEFAULT_SIZE
          })
        }
        if (rightGroup != null && rightNode != null) {
          graph.updateNodeAttribute(rightNode, 'count', _ => totalCount)
          console.log('dd')
          graph.updateNodeAttribute(rightNode, 'childCount', _ => totalCount)
          nodeAnimations.push({
            node: +rightNode,
            from: this.#nodeColors[+rightNode],
            to: this.LISTEN_COLOR,
            fromSize: this.#nodeSizes[+rightNode],
            toSize: this.FOCUS_SIZE
          });
          this.#nodeColors[+rightNode] = this.LISTEN_COLOR;
          this.#nodeSizes[+rightNode] = this.FOCUS_SIZE;
          this.#graphReset.push({
            node: +rightNode,
            from: this.#nodeColors[+rightNode],
            to: 'lightgray',
            fromSize: this.#nodeSizes[+rightNode],
            toSize: this.DEFAULT_SIZE
          })
        }

        this.#treeReset.push({
          node: j,
          from: 'blue',
          to: 'lightgray'
        });
        
        if (current != null) {
          this.#graphReset.push({
            node: current,
            from: this.#nodeColors[current],
            fromSize: this.#nodeSizes[current],
            toSize: this.DEFAULT_SIZE,
            to: 'lightgray'
          });
        }
      }
      count += 3;
    }

    vertices.reverse();
    for (const j of vertices) {
      const nodeAnimations: NodeAnimation[] = [];
      const treeAnimations: NodeAnimation[] = [];
      
      const current = +responsible[count];
      const leftOffset = Number.isNaN(current) ? 0 : graph.getNodeAttribute(`${current}`, 'offset') ?? 0;
      //  not quite right
      // const cameFromRight = !Number.isNaN(current) && +responsible[responsible.indexOf(`${current}`)] + 1 == current;
      const rightOffset = leftOffset + ((!Number.isNaN(current) && graph.getNodeAttribute(`${current}`, 'childCount')) ?? 0);
      animations.push({state: `Left Offset: ${leftOffset}, Right Offset: ${rightOffset}`, nodeAnimations, treeAnimations})
      console.log(leftOffset, rightOffset, !Number.isNaN(current) && graph.getNodeAttribute(`${current}`, 'count'), !Number.isNaN(current) && graph.getNodeAttribute(`${current}`, 'childCount'))

      this.#resetTree(treeAnimations);
      this.#resetGraph(nodeAnimations);

      treeAnimations.push({
        node: j,
        from: this.#treeColors[j - 1],
        to: "blue"
      });
      this.#treeColors[j - 1] = 'blue';
      this.#treeReset = [{
        node: j,
        from: 'blue',
        to: 'lightgray'
      }];

      const rightChild = 2 * (count - 3 * vertices.length + 1) + 3 * vertices.length - 1;
      const leftChild = rightChild + 1;
      if (!Number.isNaN(current)) {
        if (vertices[0] != j) {
          nodeAnimations.push({
            node: current,
            from: this.#nodeColors[current],
            to: this.SEND_COLOR,
            fromSize: this.#nodeSizes[current],
            toSize: this.FOCUS_SIZE
          });
          this.#nodeColors[current] = this.SEND_COLOR;
          this.#nodeSizes[current] = this.FOCUS_SIZE;
        }
        if (rightChild < responsible.length) {
          const leftNode = +responsible[leftChild];
          const rightNode = +responsible[rightChild];
          // console.log(leftNode, rightNode)
          if (!Number.isNaN(leftNode)) {
            graph.updateNodeAttribute(`${leftNode}`, 'offset', _ => leftOffset)
            nodeAnimations.push({
              node: leftNode,
              from: this.#nodeColors[leftNode],
              to: this.LISTEN_COLOR,
              fromSize: this.#nodeSizes[leftNode],
              toSize: this.FOCUS_SIZE
            });
            this.#nodeColors[leftNode] = this.LISTEN_COLOR;
            this.#nodeSizes[leftNode] = this.FOCUS_SIZE;
            this.#graphReset.push({
              node: leftNode,
              from: this.#nodeColors[leftNode],
              to: 'lightgray',
              fromSize: this.#nodeSizes[leftNode],
              toSize: this.DEFAULT_SIZE
            });
          }
          
          if (!Number.isNaN(rightNode)) {
            graph.updateNodeAttribute(`${rightNode}`, 'offset', _ => rightOffset)
            nodeAnimations.push({
              node: rightNode,
              from: this.#nodeColors[rightNode],
              to: this.LISTEN_COLOR,
              fromSize: this.#nodeSizes[rightNode],
              toSize: this.FOCUS_SIZE
            });
            this.#nodeColors[rightNode] = this.LISTEN_COLOR;
            this.#nodeSizes[rightNode] = this.FOCUS_SIZE;
            if (+responsible[count + 1] != rightNode) {
              this.#graphReset.push({
                node: rightNode,
                from: this.#nodeColors[rightNode],
                to: 'lightgray',
                fromSize: this.#nodeSizes[rightNode],
                toSize: this.DEFAULT_SIZE
              });
            }
          }
        } else {
          let group = groups[current];
          if (group % 2 == 1) {
            group--;
          }

          // console.log(current)
          for (let i = 0; i < groups.length; i++) {
            if (groups[i] == group || groups[i] == group + 1) {
              if (current != i) {
                nodeAnimations.push({
                  node: i,
                  from: this.#nodeColors[i],
                  to: this.LISTEN_COLOR,
                  fromSize: this.#nodeSizes[i],
                  toSize: this.FOCUS_SIZE
                });
                this.#nodeColors[i] = this.LISTEN_COLOR;
                this.#nodeSizes[i] = this.FOCUS_SIZE;
                this.#graphReset.push({
                  node: i,
                  from: this.#nodeColors[i],
                  to: 'lightgray',
                  fromSize: this.#nodeSizes[i],
                  toSize: this.DEFAULT_SIZE
                });
              }
              graph.updateNodeAttribute(`${i}`, 'id', id => id + (groups[i] == group ? leftOffset : rightOffset));
            }
          }

          // console.log('total: ' + total, 'group ' + i)

          if (level != 1 || total >= this.f[1]) {
            for (let j = 0; j < newGroups.length; j++) {
              if (groups[j] == group || groups[j] == group + 1) {
                newGroups[j] = i;
                graph.updateNodeAttribute(`${j}`, 'count', _ => total);
                graph.updateNodeAttribute(`${j}`, 'childCount', _ => total);
                graph.updateNodeAttribute(`${j}`, 'offset', _ => 0);
              }
            }
          }
        }

        this.#graphReset.push({
          node: current,
          from: this.#nodeColors[current],
          to: 'lightgray',
          fromSize: this.#nodeSizes[current],
          toSize: this.DEFAULT_SIZE
        });
      }
      count++;
    }

    return animations;
  }

  #resetTree(treeAnimations: NodeAnimation[]): void {
    for (const animation of this.#treeReset) {
      this.#treeColors[animation.node - 1] = animation.to;
    }
    treeAnimations.push(...this.#treeReset);
    this.#treeReset = [];
  }

  #resetGraph(nodeAnimations: NodeAnimation[]): void {
    for (const animation of this.#graphReset) {
      this.#nodeColors[animation.node] = animation.to;
      this.#nodeSizes[animation.node] = animation.toSize ?? this.DEFAULT_SIZE
    }
    nodeAnimations.push(...this.#graphReset);
    this.#graphReset = [];
  }
}
