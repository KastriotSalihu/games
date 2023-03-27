import {Engine} from "../../libs/shared/engine.js";
import {Canvas, Collection, Drawable, Movable, Shape, Square} from "../../libs/plis/index.js";
import {Coordinate, GameMap} from "../../libs/shared/2D-game-map.js";
import {PlayArea} from "../../libs/shared/play-area.js";
import {GameMapToCanvasConverter} from "../../libs/shared/coordinate-converter.js";
import {Direction, ShapeMover} from "../../libs/shared/shape-mover.js";

type EngineProperties = {
    blockSize: number
}

export class SnakeEngine extends Engine {
    private areaMap: AreaMap;
    private playArea: SnakePlayArea;
    private lifecycleIntervalId: ReturnType<typeof setInterval>
    private coordinateConverter: GameMapToCanvasConverter;

    constructor(canvas: HTMLCanvasElement, private properties: EngineProperties) {
        super();
        this.playArea = new SnakePlayArea(new Canvas(canvas, {withAnimations: {fillStyle: "rgba(255, 255, 255, 0.7)"}}));
        this.areaMap = new AreaMap(Math.floor(canvas.height / properties.blockSize), Math.floor(canvas.width / properties.blockSize), properties.blockSize);
        this.coordinateConverter = new GameMapToCanvasConverter(properties.blockSize, properties.blockSize);

        this.keyBinds.map("KeyF", "Fruit");
        this.keyBinds.setAction("Fruit", (event) => this.fireNewFruit(event));

        this.keyBinds.map("ArrowDown", "Move");
        this.keyBinds.map("ArrowUp", "Move");
        this.keyBinds.map("ArrowLeft", "Move");
        this.keyBinds.map("ArrowRight", "Move");
        this.keyBinds.setAction("Move", event => this.fireMove(event));

        this.keyBinds.map("KeyG", "Grow");
        this.keyBinds.setAction("Grow", (event) => this.fireGrow(event));
    }

    public override render() {
        this.playArea.render();
    }

    public override start() {
        console.log("Start Snake");
        const snake = new Snake(this.properties.blockSize);
        this.playArea.add(snake);
        this.playArea.actionable = snake;
        this.startLifecycle();
    }

    public override tick() {
        this.moveSnake(Direction.None);
    }

    public override end() {
        super.end();
        clearInterval(this.lifecycleIntervalId);
        this.playArea.actionable = null;
        console.log("Game Over");
    }

    private fireNewFruit(event: KeyboardEvent) {
        this.addNewFruit();
    }

    private fireMove(event: KeyboardEvent) {
        const pressedKey = event.code;
        this.moveSnake(Direction[pressedKey]);
    }

    private fireGrow(event: KeyboardEvent) {
        const snake = this.playArea.actionable;
        snake.grow();
    }

    private startLifecycle() {
        this.lifecycleIntervalId = setInterval(() => {
            this.tick();
            this.render();
        }, 50);
    }

    private moveSnake(direction: Direction) {
        const snake = this.playArea.actionable;
        const {occupiedPosition, freedPosition} = snake.move(direction);

        const pointToMoveTo = this.coordinateConverter.convertToAreaMapCoordinate(occupiedPosition.point);
        if (!this.isValidPosition(pointToMoveTo)) {
            snake.undoMove();
            return;
        }

        this.interact(snake, pointToMoveTo.row, pointToMoveTo.column);

        this.areaMap.occupyCoordinates([{
            point: pointToMoveTo,
            artifact: occupiedPosition.artifact
        }]);
        this.areaMap.unoccupyCoordinates([
            this.coordinateConverter.convertToAreaMapCoordinate(freedPosition.point)
        ])
    }

    private isValidPosition(point: Coordinate): boolean {
        return !this.areaMap.isOutsideMapBoundaries(point.row, point.column);
    }

    private interact(snake: Snake, row: number, column: number) {
        const artifact = this.areaMap.getAt(row, column);
        if (artifact) {
            if (artifact instanceof SnakeBody) {
                this.eatSnakePiece(snake, artifact);
            } else if (artifact instanceof Fruit) {
                this.eatFruit(snake, artifact);
            }
        }
    }

    private eatFruit(snake: Snake, areaMapCoordinate: Fruit) {
        this.playArea.remove(areaMapCoordinate);
        snake.grow();
        this.addNewFruit();
        console.log("You eat fruit?")
    }

    private eatSnakePiece(snake: Snake, snakeBody: SnakeBody) {
        snakeBody.discolor();
        console.log("You eat yourself?");
    }

    private addNewFruit() {
        const {row, column} = this.areaMap.getRandomUnoccupiedCoordinate();
        const isValidCoordinate = this.areaMap.isWithinMapBoundaries(row, column);
        if (isValidCoordinate) {
            console.log("valid coord")
            const fruit = this.getFruit(row, column, this.properties.blockSize);
            this.areaMap.occupyCoordinates([{point: {row, column}, artifact: fruit}]);
            this.playArea.add(fruit);
        } else {
            this.end();
        }
    }

    private getFruit(row: number, column: number, blockSize: number): Fruit {
        return new Fruit({
            size: blockSize,
            fill: "black",
            x: this.coordinateConverter.getCoordinate(column),
            y: this.coordinateConverter.getCoordinate(row),
        });
    }
}

class SnakePlayArea extends PlayArea {
    private _actionable: Snake;

    public get actionable(): Snake {
        return this._actionable;
    }

    public set actionable(value: Snake) {
        this._actionable = value;
    }
}

class AreaMap extends GameMap<Movable> {

    public getRandomUnoccupiedCoordinate(): { row: number, column: number } {
        const randomRow = this.randomInRange(0, this.height - 1);
        const randomColumn = this.randomInRange(0, this.width - 1);
        const isOccupied = this.isOccupied(randomRow, randomColumn);
        if (isOccupied) {
            return this.findFreeCoordinateNearby(randomRow, randomColumn);
        } else {
            return {row: randomRow, column: randomColumn}
        }
    }

    private findFreeCoordinateNearby(startingRow, nearColumn): { row: number, column: number } {
        const freeCoordinate = OscillatoryIteration.findAndMap(startingRow, this.height, row => {
            const column = this.findFreeColumnNearby(row, nearColumn);
            if (column !== -1) {
                return {
                    row,
                    column
                }
            }
        })
        return freeCoordinate ??
            {
                row: -1,
                column: -1
            };
    }

    private findFreeColumnNearby(row, startingPoint): number {
        return OscillatoryIteration.find(startingPoint, this.width, (index) => {
            return this.isWithinMapBoundaries(row, index)
                && !this.isOccupied(row, index);
        });
    }

    private randomInRange = (min, max) => { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min)
    };

}

class OscillatoryIteration {
    public static find(startingPoint: number, upperLimit: number, predicate: (index: number) => boolean): number {
        for (let i = 1; i < upperLimit * 2; i++) {
            const index = OscillatoryIteration.getOscillatedIndex(i, startingPoint);
            const isFound = predicate(index);
            if (isFound) {
                return index;
            }
        }
        return -1;
    }

    public static findAndMap<R>(startingPoint: number, upperLimit: number, mapper: (index: number) => R | undefined): R | undefined {
        for (let i = 1; i < upperLimit * 2; i++) {
            const index = OscillatoryIteration.getOscillatedIndex(i, startingPoint);
            const isFound = mapper(index);
            if (isFound) {
                return isFound;
            }
        }
        return undefined;
    }

    private static getOscillatedIndex(checkAttempt, startedFrom) {
        const isCheckOnTheLeftOfTheIndexWeStartedFrom = OscillatoryIteration.shouldCheckToLeftOfStartingPoint(checkAttempt);
        const sideOffset = Math.floor(checkAttempt / 2);
        return isCheckOnTheLeftOfTheIndexWeStartedFrom
            ? OscillatoryIteration.getIndexToLeftOfStartingPoint(startedFrom, sideOffset)
            : OscillatoryIteration.getIndexToRightOfStartingPoint(startedFrom, sideOffset);
    }

    private static shouldCheckToLeftOfStartingPoint(checkAttempt: number): boolean {
        return checkAttempt % 2 === 0;
    }

    private static getIndexToLeftOfStartingPoint(startingPoint, offset) {
        return startingPoint - offset;
    }

    private static getIndexToRightOfStartingPoint(startingPoint, offset) {
        return startingPoint + offset;
    }

}

class Fruit extends Square {
}

type MovementInformation = {
    occupiedPosition: {
        artifact: Shape,
        point: { x: number, y: number }
    },
    freedPosition: {
        point: { x: number, y: number }
    }
}

class Snake extends Collection<Drawable> {
    private readonly shapeMover: ShapeMover;
    declare members: Shape[];
    private direction = Direction.ArrowRight;
    private shouldGrow = false;

    constructor(private blockSize: number) {
        super({}, []);
        this.add(this.getNewBodyPiece())
        this.grow();
        this.shapeMover = new ShapeMover(blockSize);
    }

    public move(direction): MovementInformation {
        this.updateDirection(direction);

        const {piece, position: clearedPosition} = this.getPieceToBePlacedInFrontOfHead();

        this.addPieceInFrontOfHead(piece);

        return {
            occupiedPosition: {
                artifact: piece,
                point: piece.position
            },
            freedPosition: {
                point: clearedPosition
            }
        };
    }

    public undoMove() {
        const head = this.getHead();
        const tail = this.getTail();

        const direction = this.findTailDirection();

        this.placePieceAheadOfOtherPiece(head, direction, tail);
        this.removeHead();
        this.addPieceToBodyBehindTail(head);
    }

    public grow() {
        this.shouldGrow = true;
    }

    private updateDirection(direction: Direction) {
        if (direction === Direction.None) {
            return;
        }
        this.direction = direction;
    }

    private addPieceInFrontOfHead(piece: Shape): void {
        const head = this.getHead();
        this.placePieceAheadOfOtherPiece(piece, this.direction, head);
        this.addPieceToBodyInFrontOfHead(piece);
    }

    private placePieceAheadOfOtherPiece(movingPiece: Shape, direction: Direction, absolutePiece: Shape) {
        movingPiece.setPosition(absolutePiece.position);
        this.shapeMover.moveInDirection(movingPiece, direction);
    }

    private getPieceToBePlacedInFrontOfHead() {
        if (this.shouldGrow) {
            this.shouldGrow = false;
            return {
                piece: this.getNewBodyPiece(),
                position: null
            };
        } else {
            const tail = this.removeTail();
            return {
                piece: tail,
                position: tail.position
            }
        }
    }

    private findTailDirection() {
        const tail = this.getTail();
        const pieceBeforeTail = this.members[1];
        const difference = {
            x: tail.position.x - pieceBeforeTail.position.x,
            y: tail.position.y - pieceBeforeTail.position.y,
        }
        return this.shapeMover.getMovementDirection(difference);
    }

    private getNewBodyPiece(): Shape {
        return new SnakeBody({
            size: this.blockSize,
        });
    }

    private getHead(): Shape {
        return this.members[this.members.length - 1]
    }

    private removeHead(): Shape {
        return this.members.pop();
    }

    private addPieceToBodyInFrontOfHead(piece: Shape): void {
        this.members.push(piece);
    }

    private getTail(): Shape {
        return this.members[0];
    }

    private removeTail(): Shape {
        const removedBody = this.members.splice(0, 1);
        return removedBody[0];
    }

    private addPieceToBodyBehindTail(piece: Shape): void {
        this.members.splice(0, 0, piece);
    }
}

class SnakeBody extends Square {

    public discolor() {
        this.fill = "yellow";
    }
}
