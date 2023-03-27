import {Position, Properties} from "./plis.js";
import Shape from "./shape.js";

type CircleDimension = {
    radius: number;
}

interface CircleOptions extends Position, Properties, CircleDimension {
}

class Circle extends Shape {
    protected radius: number;

    constructor(options: Partial<CircleOptions>) {
        super(options);
        this.radius = options.radius;
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position): void {
        if (!ctx) {
            return;
        }
        const shiftedPosition = this.shiftPosition(relativePosition);

        ctx.beginPath();
        ctx.arc(shiftedPosition.x, shiftedPosition.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = this.fill;
        ctx.fill();
    }
}

export default Circle;
