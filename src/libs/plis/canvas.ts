import {Drawable} from "./plis.js";

type CanvasOptions = {
    withAnimations: {
        fillStyle: string
    } | boolean
}

class Canvas {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly canvasWidth: number;
    private readonly canvasHeight: number;
    private shapes: Drawable[] = []

    constructor(canvas: HTMLCanvasElement, private options?: CanvasOptions) {
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.canvasHeight = canvas.height;
        this.canvasWidth = canvas.width;
    }

    public add(shape: Drawable) {
        this.shapes.push(shape);
    }

    public remove(shape: Drawable) {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            this.shapes.splice(index, 1);
        }
    }

    public render() {
        this.clearCanvas();
        this.shapes.forEach(shape => {
            shape.draw(this.ctx);
        })
    }

    public clear() {
        this.shapes = [];
        this.clearCanvas();
    }

    private clearCanvas() {
        const withAnimations = this.options?.withAnimations
        if (withAnimations) {
            this.ctx.fillStyle = withAnimations instanceof Object ? withAnimations.fillStyle : "rgba(255, 255, 255, 0.3)";
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        } else {
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }
}

export default Canvas;
