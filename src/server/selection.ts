import { Block, Vector3 } from "@minecraft/server";
import { Graph } from "./graph";

const min = Math.min;
const max = Math.max;

function sqaure(pos1: Vector3, pos2: Vector3) {
  const graph = new Graph("graph:sqaure", "script");
  graph.for(min(pos1.x, pos2.x), max(pos1.x, pos2.x) + 1, 1, (x) => {
    graph.plot({
      x: x,
      y: pos2.y + 1,
      z: pos2.z + (pos2.z > pos1.z ? 1 : 0),
    });
    graph.plot({
      x: x,
      y: pos2.y + 1,
      z: pos1.z + (pos1.z >= pos2.z ? 1 : 0),
    });
  });
  graph.show({
    //rgb(84,252,252)
    color: { r: 84 / 255, g: 252 / 255, b: 252 / 255, a: 1 },
    size: { height: 0.25, width: 0.25 },
  });
  graph.for(min(pos1.z, pos2.z), max(pos1.z, pos2.z) + 1, 1, (z) => {
    graph.plot({
      x: pos2.x + (pos2.x > pos1.x ? 1 : 0),
      y: pos2.y + 1,
      z: z,
    });
    graph.plot({
      x: pos1.x + (pos1.x >= pos2.x ? 1 : 0),
      y: pos2.y + 1,
      z: z,
    });
  });
  graph.show({
    //rgb(249,81,81)
    color: { r: 249 / 255, g: 81 / 255, b: 81 / 255, a: 1 },
    size: { height: 0.25, width: 0.252 },
  });
}

export const selection = {
  sqaure,
};
