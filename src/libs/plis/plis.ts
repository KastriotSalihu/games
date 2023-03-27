export interface Drawable {
    draw(ctx: CanvasRenderingContext2D, relativePosition?: Position): void;
}

export interface Movable extends Drawable {

    move(position: Position): Movable;

    setPosition(options: Position): Movable;

    get position(): Position;

    getAbsolutePosition(relativePosition?: Position): Position;
}

export type Position = {
    x: number,
    y: number,
}

export type Properties = {
    fill: string,
    stroke: string,
}
