import {Canvas, Drawable} from "../plis/plis";

export class PlayArea {
    constructor(private canvas: Canvas) {
    }

    public add(drawable: Drawable): void {
        this.canvas.add(drawable);
    }

    public addShapes(shapes: Drawable[]) {
        shapes.forEach(shape => this.canvas.add(shape));
    }

    public render() {
        this.canvas.render();
    }

    public remove(shape: Drawable) {
        this.canvas.remove(shape);
    }

    public removeShapes(shapes: Drawable[]) {
        shapes.forEach(shape => {
            this.canvas.remove(shape);
        })
    }

}
