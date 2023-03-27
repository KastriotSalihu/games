import {Drawable, Movable, Position, Properties} from "./plis.js";

 abstract class Shape implements Movable, Drawable {
    protected x: number;
    protected y: number;
    protected width: number;
    protected height: number;
    protected fill: string;
    protected stroke: string;

    protected constructor(options: Partial<Properties | Position> = {}) {
        this.setProperties(options as Properties);
        this.setPosition(options as Position);
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position) {
        throw new Error("Method not implemented.");
    }

    public get position() {
        return {
            x: this.x,
            y: this.y
        }
    }

    public move(delta: Position): Movable {
        this.setPosition(this.shiftPosition(delta));
        return this as Movable;
    }

    public getAbsolutePosition(relativePositon?: Position) {
        return this.shiftPosition(relativePositon);
    }

    public setPosition(options: Position) {
        this.x = options.x ?? 0;
        this.y = options.y ?? 0;
        return this as Movable;
    }

    protected shiftPosition(delta: Position = {x: 0, y: 0}) {
        return {
            x: delta.x + this.x,
            y: delta.y + this.y,
        }
    }

    protected setProperties(options: Properties) {
        this.fill = options.fill || "red";
        this.stroke = options.stroke || "black";
    }
}

export default Shape;
