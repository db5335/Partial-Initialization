import { Injectable } from '@angular/core';
import { GraphAnimation } from '../models/graph-animation';
import Graph from 'graphology';
import { Subject, firstValueFrom, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  state = new Subject<string | undefined>();

  #animations!: GraphAnimation[];
  #graph!: Graph;
  #tree!: Graph;
  #step: number = 0;
  #lock = new Subject<void>();
  #running = false;
  #waiting = false;

  constructor() { }

  update(graph: Graph, tree: Graph, animations: GraphAnimation[]): void {
    this.#graph = graph;
    this.#tree = tree;
    this.#animations = animations;
    this.#step = 0;
  }

  async animate(): Promise<void> {
    if (this.#waiting) {
      this.#waiting = false;
      this.#lock.next();
      return;
    }

    this.#running = true;

    if (this.#step >= this.#animations.length) {
      return;
    }

    this.state.next(this.#animations[this.#step].state)

    for (let n of this.#animations[this.#step].nodeAnimations) {
      this.#graph.updateNode(`${n.node}`, a => {
        return {
            ...a,
            type: 'border',
            color: n.to,
            label: n.toLabel,
            size: n.toSize ?? 6
        }
      });
    }

    for (let n of this.#animations[this.#step].treeAnimations) {
      this.#tree.updateNode(`${n.node}`, a => {
        return {
            ...a,
            type: 'border',
            color: n.to,
            label: n.toLabel,
            size: n.toSize ?? 6
        }
      });
    }

    this.#step++;
    return new Promise(resolve => setTimeout(() => {
      this.animate()
    }, this.#animations[this.#step]?.time ?? 1000))
  }

  async goTo(index: number): Promise<void> {

    if (this.#running) {
      this.#waiting = true;
      await firstValueFrom(this.#lock.pipe(take(1)));
    }

    this.#running = true;
    
    if (this.#step != index) {
      this.state.next(this.#animations[Math.max(index - 1, 0)].state)
      if (this.#step > index) {
        while (this.#step != index) {
          for (let n of this.#animations[this.#step - 1].nodeAnimations.slice().reverse()) {
            this.#graph.updateNode(`${n.node}`, a => {
              return {
                  ...a,
                  type: 'border',
                  color: n.from,
                  label: n.fromLabel,
                  size: n.fromSize ?? 6
              }
            });
          }
          
          for (let n of this.#animations[this.#step - 1].treeAnimations.slice().reverse()) {
            this.#tree.updateNode(`${n.node}`, a => {
              return {
                  ...a,
                  type: 'border',
                  color: n.from,
                  size: n.fromSize ?? 6
              }
            });
          }

          this.#step--;
        }
      } else {
        while (this.#step != index) {
          for (let n of this.#animations[this.#step].nodeAnimations) {
            this.#graph.updateNode(`${n.node}`, a => {
              return {
                  ...a,
                  type: 'border',
                  color: n.to,
                  size: n.toSize ?? 6
              }
            });
          }

          for (let n of this.#animations[this.#step].treeAnimations) {
            this.#tree.updateNode(`${n.node}`, a => {
              return {
                  ...a,
                  type: 'border',
                  color: n.to,
                  size: n.toSize ?? 6
              }
            });
          }

          this.#step++;
        }
      }
    }

    this.#running = false;
    this.#lock.next();
  }
}
