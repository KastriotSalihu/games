import {Position, Properties} from "./plis.js";
import Shape from "./shape.js";

interface Options extends Dimension, Position, Properties {
}

type Dimension = {
    size: number
}

class Square extends Shape {
    private size: number;

    constructor(options: Partial<Options>) {
        super(options);
        this.setDimensions(options as Options);
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position): void {
        if (!ctx) {
            return;
        }
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        const shiftedPosition = this.shiftPosition(relativePosition);
        ctx.fillRect(shiftedPosition.x, shiftedPosition.y, this.size, this.size);
        ctx.strokeRect(shiftedPosition.x, shiftedPosition.y, this.size, this.size);
    }

    protected setDimensions(options: Options) {
        if (options.size < 0) {
            throw new Error("Size needs to be a positive number.")
        }
        this.size = options.size;
    }
}

export default Square;
