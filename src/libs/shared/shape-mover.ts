import {Movable} from "../plis/plis.js";

export enum Direction {
    ArrowUp = "ArrowUp",
    ArrowDown = "ArrowDown",
    ArrowLeft = "ArrowLeft",
    ArrowRight = "ArrowRight",

    None = "None",
}

export interface Velocity {
    x: number,
    y: number
}

export class ShapeMover {
    private readonly movements: {};

    constructor(private blockSize: number, private speed = 1) {
        this.movements = {
            [Direction.ArrowUp]: {x: 0, y: -1 * this.speed, opposite: () => this.movements[Direction.ArrowDown]},
            [Direction.ArrowDown]: {x: 0, y: 1 * this.speed, opposite: () => this.movements[Direction.ArrowUp]},
            [Direction.ArrowLeft]: {x: -1 * this.speed, y: 0, opposite: () => this.movements[Direction.ArrowRight]},
            [Direction.ArrowRight]: {x: 1 * this.speed, y: 0, opposite: () => this.movements[Direction.ArrowLeft]}
        };
    }

    public moveInDirection(shape: Movable, direction: Direction) {
        shape.move({
            x: this.movements[direction].x * this.blockSize,
            y: this.movements[direction].y * this.blockSize
        })
    }

    public moveWithVelocity(shape: Movable, veloctiy: Velocity) {
        shape.move({
            x: veloctiy.x,
            y: veloctiy.y
        })
    }

    public getMovementDirection(positionDifference: { x: number, y: number }): Direction {
        const {x, y} = positionDifference;
        if (x === 0 && y < 0) {
            return Direction.ArrowUp;
        } else if (x === 0 && y > 0) {
            return Direction.ArrowDown;
        }
        if (x < 0 && y === 0) {
            return Direction.ArrowLeft;
        } else if (x > 0 && y === 0) {
            return Direction.ArrowRight;
        }
        return null;
    }
}
