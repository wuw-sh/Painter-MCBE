import * as sv from "@minecraft/server";
import * as ui from "@minecraft/server-ui";
import { Graph } from "./graph";
import { selection } from "./selection";

enum PainterMode {
  Paint = "paint",
  Fill = "fill",
  Line = "line",
  Circle = "circle",
}

interface PosSelection {
  pos1: sv.Vector3 | undefined;
  pos2: sv.Vector3 | undefined;
}

const run = (callback: () => void) => sv.system.run(callback);
const runInterval = (callback: () => void, interval?: number) =>
  sv.system.runInterval(callback, interval);
const tick = () => sv.system.currentTick;

class Database<Key extends string, Value extends any> {
  player: sv.Player;
  constructor(player: sv.Player) {
    this.player = player;
  }

  init(key: Key, value: Value): void {
    if (!this.has(key)) {
      this.set(key, value);
    }
  }

  set(key: Key, value: Value): void {
    try {
      this.player.setDynamicProperty(key, JSON.stringify(value));
    } catch (e) {
      this.player.setDynamicProperty(key, value as any);
    }
  }

  get(key: Key): Value | undefined {
    if (!this.has(key)) return undefined;
    try {
      return JSON.parse(String(this.player.getDynamicProperty(key)));
    } catch (e) {
      return this.player.getDynamicProperty(key) as any;
    }
  }

  has(key: Key): boolean {
    return !!this.player.getDynamicProperty(key);
  }
}

const pi = Math.PI;
const abs = Math.abs;
const floor = Math.floor;
const cos = Math.cos;
const sin = Math.sin;
const tan = Math.tan;
const acos = Math.acos;
const asin = Math.asin;
const atan = Math.atan;
const atan2 = Math.atan2;
const sqrt = Math.sqrt;
const min = Math.min;
const max = Math.max;

sv.world.beforeEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  const item = ev.itemStack;
  const painterModeDB = new Database<string, PainterMode>(player);
  if (item.typeId === "minecraft:brush") {
    run(() => {
      const form = new ui.ActionFormData();
      form.title("Painter Menu");
      form.button("Sttings");
      Object.getOwnPropertyNames(PainterMode).forEach((mode) =>
        form.button(mode)
      );
      form.show(player).then((res) => {
        if (res.canceled) return;
        if (res.selection === 0) {
          const form = new ui.ActionFormData();
          form.title("Painter Settings");
          form.button("Permissions");
          
          return;
        }
        const painterDB = new Database<PainterMode, any>(player);
        Object.getOwnPropertyNames(PainterMode).forEach((mode, i) => {
          painterDB.set(
            PainterMode[mode as keyof typeof PainterMode],
            undefined
          );
          if (res.selection === i + 1) {
            painterModeDB.set(
              "painterMode",
              PainterMode[mode as keyof typeof PainterMode]
            );
          }
        });
      });
    });
  } else {
    const painterMode = painterModeDB.get("painterMode");
    const block = player.getBlockFromViewDirection()?.block;
    switch (painterMode) {
      case PainterMode.Paint:
        const paintDB = new Database<PainterMode, boolean>(player);
        const paintData = paintDB.get(PainterMode.Paint);
        if (paintData) {
          paintDB.set(PainterMode.Paint, false);
        } else {
          paintDB.set(PainterMode.Paint, true);
        }
        break;
      case PainterMode.Fill:
        const fillDB = new Database<PainterMode, PosSelection>(player);
        const fillData = fillDB.get(PainterMode.Fill);
        if (!block) return;
        if (fillData?.pos1 && fillData?.pos2) {
          const minX = min(fillData.pos1.x, fillData.pos2.x);
          const maxX = max(fillData.pos1.x, fillData.pos2.x);
          const minY = min(fillData.pos1.y, fillData.pos2.y);
          const maxY = max(fillData.pos1.y, fillData.pos2.y);
          const minZ = min(fillData.pos1.z, fillData.pos2.z);
          const maxZ = max(fillData.pos1.z, fillData.pos2.z);
          for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
              for (let z = minZ; z <= maxZ; z++) {
                const block = player.dimension.getBlock({ x, y, z });
                if (!block) continue;
                if (block.typeId === item.typeId) continue;
                run(() => {
                  block.setPermutation(
                    sv.BlockPermutation.resolve(item.typeId)
                  );
                });
              }
            }
          }
          run(() =>
            fillDB.set(PainterMode.Fill, { pos1: undefined, pos2: undefined })
          );
        }
        fillDB.set(PainterMode.Fill, {
          pos1: !fillData?.pos1 ? block.location : fillData.pos1,
          pos2:
            fillData?.pos1 && !fillData?.pos2
              ? block?.location
              : fillData?.pos2,
        });
        break;
      case PainterMode.Line:
        const lineDB = new Database<PainterMode, PosSelection>(player);
        const lineData = lineDB.get(PainterMode.Line);
        if (!block) return;
        lineDB.set(PainterMode.Line, {
          pos1: !lineData?.pos1 ? block.location : lineData.pos1,
          pos2:
            lineData?.pos1 && !lineData?.pos2
              ? block?.location
              : lineData?.pos2,
        });
        break;
      case PainterMode.Circle:
        const circleDB = new Database<PainterMode, PosSelection>(player);
        const circleData = circleDB.get(PainterMode.Circle);
        if (!block) return;
        circleDB.set(PainterMode.Circle, {
          pos1: !circleData?.pos1 ? block.location : circleData.pos1,
          pos2:
            circleData?.pos1 && !circleData?.pos2
              ? block?.location
              : circleData?.pos2,
        });
        break;
    }
  }

  ev.cancel = true;
});
sv.world.beforeEvents.itemUseOn.subscribe((ev) => {
  ev.cancel = true;
});
sv.world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  ev.cancel = true;
});
sv.world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
  ev.cancel = true;
});

const graph = new Graph("graph:painter", "script");

runInterval(() => {
  sv.world.getAllPlayers().forEach((player) => {
    const painterModeDB = new Database<string, PainterMode>(player);
    painterModeDB.init("painterMode", PainterMode.Paint);
    const painterMode = painterModeDB.get("painterMode");
    const sendActionBar = (msg: string) =>
      player.onScreenDisplay.setActionBar(msg);
    const block = player.getBlockFromViewDirection()?.block;
    if (!block) return;
    const item = player
      .getComponent("inventory")
      ?.container?.getItem(player.selectedSlot);
    if (!item) return;
    switch (painterMode) {
      case PainterMode.Paint:
        const paintDB = new Database<PainterMode, boolean>(player);
        paintDB.init(PainterMode.Paint, false);
        const paintData = paintDB.get(PainterMode.Paint);
        if (paintData) {
          block.setPermutation(sv.BlockPermutation.resolve(item.typeId));
        }
        sendActionBar(
          `Item: §e${toTitleCase(
            item.typeId
          )}\n§7Mode: ${painterMode}\nToggle: ${paintData ? "§aOn" : "§cOff"}`
        );
        break;
      case PainterMode.Fill:
        const fillDB = new Database<PainterMode, PosSelection>(player);
        fillDB.init(PainterMode.Fill, { pos1: undefined, pos2: undefined });
        const fillData = fillDB.get(PainterMode.Fill);
        if (!fillData?.pos1 && !fillData?.pos2) {
          selection.sqaure(block.location, block.location);
        } else if (fillData.pos1 && !fillData?.pos2) {
          selection.sqaure(fillData.pos1, block.location);
        } else if (fillData.pos1 && fillData.pos2) {
          selection.sqaure(fillData.pos1, fillData.pos2);
        }
        sendActionBar(
          `Item: §e${toTitleCase(item.typeId)}\n§7Mode: ${painterMode}\nPos1: ${
            fillData?.pos1
              ? `§2(§a${fillData.pos1.x}§2, §a${fillData.pos1.z}§2)`
              : `§4(§c${block.location.x}§4, §c${block.location.z}§4)`
          }\n§7Pos2: ${
            fillData?.pos2
              ? `§2(§a${fillData.pos2.x}§2, §a${fillData.pos2.z}§2)`
              : `§4(§c${block.location.x}§4, §c${block.location.z}§4)`
          }\n§7Length: (§b${
            (fillData?.pos1 && fillData?.pos2
              ? max(fillData.pos1.x, fillData.pos2.x) -
                min(fillData.pos1.x, fillData.pos2.x)
              : fillData?.pos1
              ? max(fillData.pos1.x, block.location.x) -
                min(fillData.pos1.x, block.location.x)
              : !fillData?.pos1 && !fillData?.pos2
              ? max(block.location.x, block.location.x) -
                min(block.location.x, block.location.x)
              : 0) + 1
          }§7, §c${
            (fillData?.pos1 && fillData?.pos2
              ? max(fillData.pos1.z, fillData.pos2.z) -
                min(fillData.pos1.z, fillData.pos2.z)
              : fillData?.pos1
              ? max(fillData.pos1.z, block.location.z) -
                min(fillData.pos1.z, block.location.z)
              : !fillData?.pos1 && !fillData?.pos2
              ? max(block.location.z, block.location.z) -
                min(block.location.z, block.location.z)
              : 0) + 1
          }§7)`
        );
        break;
      // case PainterMode.Line:
      //   const lineDB = new Database<PainterMode, PosSelection>(player);
      //   lineDB.init(PainterMode.Line, { pos1: undefined, pos2: undefined });
      //   const lineData = lineDB.get(PainterMode.Line);
      //   if (!lineData?.pos1 && !lineData?.pos2) {
      //     graph.for(block.location.x, block.location.x + 1, 0.5, (x) => {
      //       graph.plot({ x: x, y: block.location.y + 1, z: block.location.z });
      //       graph.plot({
      //         x: x,
      //         y: block.location.y + 1,
      //         z: block.location.z + 1,
      //       });
      //     });
      //     graph.for(block.location.z, block.location.z + 1, 0.5, (z) => {
      //       graph.plot({ x: block.location.x, y: block.location.y + 1, z: z });
      //       graph.plot({ x: block.location.x + 1, y: block.location.y + 1, z });
      //     });
      //     graph.show();
      //   } else if (lineData.pos1 && !lineData?.pos2) {
      //     graph.for(
      //       min(lineData.pos1.x, block.location.x),
      //       max(lineData.pos1.x, block.location.x) + 1,
      //       0.5,
      //       (x) => {
      //         if (!lineData.pos1) return;
      //         graph.plot({
      //           x: x,
      //           y: block.location.y + 1,
      //           z:
      //             block.location.z +
      //             (block.location.z > lineData.pos1.z ? 1 : 0),
      //         });
      //         graph.plot({
      //           x: x,
      //           y: block.location.y + 1,
      //           z:
      //             lineData.pos1.z +
      //             (lineData.pos1.z >= block.location.z ? 1 : 0),
      //         });
      //       }
      //     );
      //     graph.for(
      //       min(lineData.pos1.z, block.location.z),
      //       max(lineData.pos1.z, block.location.z) + 1,
      //       0.5,
      //       (z) => {
      //         if (!lineData.pos1) return;
      //         graph.plot({
      //           x:
      //             block.location.x +
      //             (block.location.x > lineData.pos1.x ? 1 : 0),
      //           y: block.location.y + 1,
      //           z: z,
      //         });
      //         graph.plot({
      //           x:
      //             lineData.pos1.x +
      //             (lineData.pos1.x >= block.location.x ? 1 : 0),
      //           y: block.location.y + 1,
      //           z: z,
      //         });
      //       }
      //     );
      //   }
    }
  });
});

function toTitleCase(str: string) {
  return str
    .split(":")[1]
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

sv.system.beforeEvents.watchdogTerminate.subscribe((ev) => {
  sv.world.getAllPlayers().forEach((player) => {
    player.clearDynamicProperties();
  });
  ev.cancel = true;
});
