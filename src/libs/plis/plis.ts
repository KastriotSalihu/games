export interface Drawable {
    draw(ctx: CanvasRenderingContext2D, relativePosition?: Position): void;
}

export interface Movable extends Drawable {

    move(position: Position): Movable;

    setPosition(options: Position): Movable;

    get position(): Position;

    getAbsolutePosition(relativePosition?: Position): Position;
}

export class Canvas {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly canvasWidth: number;
    private readonly canvasHeight: number;
    private shapes: Drawable[] = []

    constructor(canvas: HTMLCanvasElement) {
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
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

export abstract class Shape implements Movable, Drawable {
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

export class Rectangle extends Shape {
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

export class Square extends Shape {
    private size: number;

    constructor(options: Partial<SquareOptions>) {
        super(options);
        this.setDimensions(options as SquareOptions);
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

    protected setDimensions(options: SquareOptions) {
        if (options.size < 0) {
            throw new Error("Size needs to be a positive number.")
        }
        this.size = options.size;
    }

}

export class Collection<T extends Drawable> implements Drawable {
    protected members: Array<T> = [];

    constructor(options: Partial<Options>, members: T[]) {

        members.forEach(member => {
            this.add(member)
        })
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position): void {
        if (!ctx) {
            return;
        }
        this.members.forEach(member => {
            member.draw(ctx, relativePosition);
        });
    }

    public getShapes() {
        return this.members;
    }

    public add(member: T) {
        this.members.push(member);
    }

    public clear() {
        this.members = [];
    }
}

export class Group extends Shape {
    private collection: Collection<Shape>;

    constructor(options: Partial<Options>, members: Shape[]) {
        super(options);
        this.collection = new Collection(options, members);
    }

    public ungroup(relativePosition?: Position): Shape[] {
        const shiftedPosition = this.shiftPosition(relativePosition);
        this.collection.getShapes().forEach(member => {
            const absolutePosition = member.getAbsolutePosition(shiftedPosition);
            member.setPosition(absolutePosition);
        })
        const removedMembers = this.collection.getShapes();
        this.collection.clear();
        return removedMembers;
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position) {
        const shiftedPosition = this.shiftPosition(relativePosition);
        this.collection.draw(ctx, shiftedPosition);
    }

    public add(member: Shape) {
        this.collection.add(member);
    }

    public getShapes() {
        return this.collection.getShapes();
    }
}

// TYPES
interface Options extends Position, Dimension, Properties {
}

interface SquareOptions extends SquareDimension, Position, Properties {
}

type SquareDimension = {
    size: number
}

type Dimension = {
    width: number,
    height: number,
}

type Position = {
    x: number,
    y: number,
}

type Properties = {
    fill: string,
    stroke: string,
}
