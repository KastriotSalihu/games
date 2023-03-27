import {Position, Properties} from "./plis.js";
import Shape from "./shape.js";

interface Options extends Position, Dimension, Properties {
}

type Dimension = {
    width: number,
    height: number,
}

class Rectangle extends Shape {
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
        ctx.fillRect(shiftedPosition.x, shiftedPosition.y, this.width, this.height);
        ctx.strokeRect(shiftedPosition.x, shiftedPosition.y, this.width, this.height);
    }

    protected setDimensions(options: Dimension) {
        Rectangle.validateDimensions(options as Dimension);
        this.width = options.width;
        this.height = options.height;
    }

    protected static validateDimensions(options: Dimension) {
        const {width, height} = options;

        if (width < 0) {
            throw new Error("Width needs to be a positive number.")
        }

        if (height < 0) {
            throw new Error("Width needs to be a positive number.")
        }
    }
}

export default Rectangle;
