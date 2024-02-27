import * as sv from "@minecraft/server";
const sin = Math.sin;
const arcsin = Math.asin;
class a {
    constructor(id, selection) {
        this.selection = selection;
        this.id = id;
        switch (true) {
            case !id.includes(":"):
                throw new Error(`§lGraph Api §e| §cId "${id}" must have ":" (must be like "xxx:yyy" or "x_x:y-y")§r`);
            case id.startsWith(":"):
                throw new Error(`§lGraph Api §e| §cId "${id}" mustn't start with ":" (must be like "xxx:yyy" or "x_x:y-y")§r`);
            case id.endsWith(":"):
                throw new Error(`§lGraph Api §e| §cId "${id}" mustn't end with ":" (must be like "xxx:yyy" or "x_x:y-y")§r`);
            case id.split(":").length > 2:
                throw new Error(`§lGraph Api §e| §cId "${id}" must have only one ":" (must be like "xxx:yyy" or "x_x:y-y")§r`);
            case id.startsWith("minecraft:"):
                throw new Error(`§lGraph Api §e| §cId "${id}" mustn't start with "minecraft:" (must be like "xxx:yyy" or "x_x:y-y")§r`);
            case !/^[a-zA-Z_-]+:[a-zA-Z_-]+$/i.test(id):
                throw new Error(`§lGraph Api §e| §cInvalid id format "${id}" mustn't have number or special character (must be like "xxx:yyy" or "x_x:y-y")§r`);
        }
    }
}
export class Graph extends a {
    constructor(id, selection) {
        super(id, selection);
        this.location = sv.Vector.zero;
        this.isActived = false;
        this.RGBfade = 0;
        this.RGBcolor = { r: 0, g: 0, b: 0 };
        this.selection = "cmd";
        this.points = [];
        this.id = id;
    }
    setParticle(x, y, z, config = {
        color: { r: 1, g: 1, b: 1, a: 1 },
        size: { width: 0.1, height: 0.1 },
    }) {
        const molangVar = new sv.MolangVariableMap();
        molangVar.setColorRGBA("color", {
            red: config.color.r,
            green: config.color.g,
            blue: config.color.b,
            alpha: config.color.a,
        });
        molangVar.setFloat("width", config.size.width);
        molangVar.setFloat("height", config.size.height);
        sv.world
            .getDimension("overworld")
            .spawnParticle("graph:point", { x: x, y: y, z: z }, molangVar);
    }
    // make if this.selection is "script" dont show onRun function when calling Graph class on auto complete
    onRun(callback) {
        sv.system.afterEvents.scriptEventReceive.subscribe((event) => {
            if (event.id === this.id) {
                callback(event);
            }
        });
    }
    show(config = {
        color: { r: 1, g: 1, b: 1, a: 1 },
        size: { width: 0.1, height: 0.1 },
    }) {
        // this.onRun((event) => {
        let location = sv.Vector.zero;
        // switch (true) {
        //   case !!event.sourceEntity:
        //     location = event.sourceEntity.location;
        //     break;
        //   case !!event.sourceBlock:
        //     location = event.sourceBlock.location;
        //     break;
        //   default:
        //     throw new Error("Graph Api | §cError to get source§r");
        // }
        this.isActived = true;
        this.location = location;
        this.points.forEach((point) => {
            this.setParticle(point.x, point.y, point.z, config);
            this.points = this.points.filter((p) => p !== point);
        });
        if (this.RGBfade <= 360)
            this.RGBfade++;
        else
            this.RGBfade = 0;
        // });
    }
    plot(location) {
        this.points.push(location);
        return this;
    }
    for(start, end, increase, callback) {
        for (let i = start; i <= end; i += increase) {
            callback(i);
        }
    }
    interval(start, end, increase, callback) {
        this.onRun(() => {
            this.for(start, end, increase, callback);
        });
    }
    genRainbowColor(speed = 0.1, offset = { r: 0, g: 0, b: 0, a: 1 }) {
        this.RGBcolor.r = sin(speed * this.RGBfade + offset.r + 0) * 127 + 128;
        this.RGBcolor.g = sin(speed * this.RGBfade + offset.g + 2) * 127 + 128;
        this.RGBcolor.b = sin(speed * this.RGBfade + offset.b + 4) * 127 + 128;
        return this.formatColor(this.RGBcolor.r, this.RGBcolor.g, this.RGBcolor.b);
    }
    formatColor(r, g, b, a = 1) {
        return {
            r: Number((r / 255).toFixed(3)),
            g: Number((g / 255).toFixed(3)),
            b: Number((b / 255).toFixed(3)),
            a: a,
        };
    }
}
