import { Component, OnInit } from '@angular/core';
import { createNodeBorderProgram } from '@sigma/node-border';
import Graph from 'graphology';
import Sigma from 'sigma';
import { GraphAnimation } from 'src/app/models/graph-animation';
import { AlgorithmService } from 'src/app/services/algorithm.service';
import { AnimationService } from 'src/app/services/animation.service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {
  graph!: Graph;
  tree!: Graph;
  animations: GraphAnimation[] = [];
  state?: string

  constructor(
    private _algorithmService: AlgorithmService,
    private _animationService: AnimationService
  ) {
    // Empty constructor
  }


  ngOnInit(): void {
    this.graph = new Graph();
    this.tree = new Graph();
    this._algorithmService.createNetwork(this.graph);
    this._algorithmService.createBinaryTree(this.tree);
    this.animations = this._algorithmService.initialize(this.graph, this.tree);
    this._animationService.state.subscribe((value) => this.state = value);
    this._animationService.update(this.graph, this.tree, this.animations);
    this._animationService.animate();

    console.log(this.animations);

    const sigmaInstance1 = new Sigma(this.graph, document.getElementById("graph")!, {
      defaultNodeType: "border",
      nodeProgramClasses: {
        border: createNodeBorderProgram({
          borders: [
            { size: { attribute: "borderSize", defaultValue: 0.2 }, color: { attribute: "borderColor" } },
            { size: { fill: true }, color: { attribute: "color" } },
          ],
        }),
      },
    });

    const sigmaInstance2 = new Sigma(this.tree, document.getElementById("tree")!, {
      defaultNodeType: "border",
      nodeProgramClasses: {
        border: createNodeBorderProgram({
          borders: [
            { size: { attribute: "borderSize", defaultValue: 0.2 }, color: { attribute: "borderColor" } },
            { size: { fill: true }, color: { attribute: "color" } },
          ],
        }),
      },
    });
  }

  goTo(n: number): void {
    this._animationService.goTo(n);
  }

  play(): void {
    this._animationService.animate();
  }
}

