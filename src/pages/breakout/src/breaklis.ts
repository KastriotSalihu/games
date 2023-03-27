import {
    Engine,
    GameMapToCanvasConverter,
    ShapeMover,
    Velocity,
    PlayArea,
    GameMap,
    GameMapCoordinates
} from "../../../libs/shared";
import {Canvas, Circle, Group, Movable, Rectangle, Square} from "../../../libs/plis";

type EngineProperties = {
    blockSize: number,
    rows: number,
    columns: number
}

enum Direction {
    ArrowUp = "ArrowUp",
    ArrowDown = "ArrowDown",
    ArrowLeft = "ArrowLeft",
    ArrowRight = "ArrowRight",
}

export class BreakoutEngine extends Engine {
    private readonly areaMap: AreaMap;
    private readonly playArea: BreakoutPlayArea;
    private readonly coordinateConverter: GameMapToCanvasConverter;
    private readonly ballMover: BallMover;

    constructor(canvas: HTMLCanvasElement, private properties: EngineProperties) {
        super();
        this.playArea = new BreakoutPlayArea(new Canvas(canvas, {withAnimations: true}));
        this.areaMap = new AreaMap(properties.rows, properties.columns, properties.blockSize);
        this.coordinateConverter = new GameMapToCanvasConverter(properties.blockSize, properties.blockSize);
        this.ballMover = new BallMover(properties.blockSize, this.areaMap);

        this.keyBinds.map("ArrowLeft", "Move");
        this.keyBinds.map("ArrowRight", "Move");
        this.keyBinds.setAction("Move", event => this.fireMove(event));

        this.keyBinds.map("KeyG", "GrowBoard");
        this.keyBinds.setAction("GrowBoard", () => this.playArea.actionable.grow());


        this.keyBinds.map("KeyS", "ShrinkBoard");
        this.keyBinds.setAction("ShrinkBoard", () => this.playArea.actionable.shrink());

        this.keyBinds.map("Space", "NewBall");
        this.keyBinds.setAction("NewBall", event => this.fireNewBall(event));
    }

    public override start() {
        const paddle = new Paddle(this.properties.blockSize / 2.5);
        paddle.grow();
        const drawable = paddle.getDrawable();
        this.playArea.add(drawable);
        drawable.setPosition({
            x: (this.areaMap.dimensions.width * this.properties.blockSize) / 2 - this.properties.blockSize,
            y: (this.areaMap.dimensions.height * this.properties.blockSize) - this.properties.blockSize * 2
        })
        this.playArea.actionable = paddle;
        this.createBricks();
        this.addNewBall();
        this.startLifecycle();
    }

    public override render() {
        this.playArea.render();
    }

    public override tick() {
        this.ballMover.move();
    }

    private startLifecycle() {
        window.requestAnimationFrame(() => {
            this.tick();
            this.render();
            this.startLifecycle();
        })
    }

    private fireMove(event: KeyboardEvent) {
        const pressedKey = event.code;
        this.moveBoard(Direction[pressedKey]);
    }

    private fireNewBall(_: KeyboardEvent) {
        this.addNewBall();
    }

    private addNewBall() {
        const paddle = this.playArea.actionable;
        const drawable = paddle.getDrawable();
        const newBallPosition = {x: drawable.position.x, y: drawable.position.y + 1}
        const ball = new Ball(10, newBallPosition.x, newBallPosition.y);
        this.ballMover.add(ball);
        this.playArea.add(ball);
    }

    private moveBoard(direction: Direction) {
        const board = this.playArea.actionable;
        board.move(direction);
    }

    private createBricks() {
        const rowColors = ["red", "red", "orange", "orange", "green", "green", "yellow", "yellow"];
        const brickHeight = this.properties.blockSize / 3.5;
        rowColors.forEach((rowColor, index) => {
            const bricks = this.getBrickRow(rowColor, index, brickHeight);
            bricks.forEach(brick => {
                this.playArea.add(brick);
                this.areaMap.occupyCoordinates(brick.toAreaMapCoordinates());
            });
        })
    }

    private getBrickRow(color: string, row: number, brickHeight: number) {
        const gameMapDimensions = this.areaMap.dimensions;
        const brickWidth = this.properties.blockSize;
        const coordinateConverter = new GameMapToCanvasConverter(brickWidth, brickHeight)
        return Array(gameMapDimensions.width).fill(null).map((_, index) => new Brick({
            color,
            width: brickWidth,
            height: brickHeight,
            x: index * brickWidth,
            y: row * brickHeight,
        }, coordinateConverter));
    }
}

class BreakoutPlayArea extends PlayArea {
    private _actionable: Paddle;

    public get actionable(): Paddle {
        return this._actionable;
    }

    public set actionable(value: Paddle) {
        this._actionable = value;
    }
}

class Paddle {
    private readonly shapeMover: ShapeMover;
    private shape = new Group({}, []);

    constructor(private blockSize: number) {
        this.shapeMover = new ShapeMover(blockSize);
    }

    public move(direction: Direction) {
        this.shapeMover.moveInDirection(this.shape, direction);
    }

    public grow() {
        const currentBlock = this.shape.getMembersLength();
        this.shape.add(this.newBlock({x: currentBlock * this.blockSize}));
        this.shape.add(this.newBlock({x: (currentBlock + 1) * this.blockSize}));
        this.move(Direction.ArrowLeft);
    }

    public shrink() {
        if (this.shape.getMembersLength() <= 2) {
            return;
        }
        this.shape.pop();
        this.shape.pop();
        this.move(Direction.ArrowRight);
    }

    public getDrawable() {
        return this.shape;
    }

    private newBlock(options: any) {
        return new Square({size: this.blockSize, fill: "black", ...options});
    }
}

class AreaMap extends GameMap<Movable> {

    constructor(height: number, width: number, blockSize: number) {
        super(height, width, blockSize);
    }

    public get dimensions() {
        return {width: this.width, height: this.height}
    }
}

class Ball extends Circle {
    public velocity = {x: 8, y: -3};

    constructor(radius: number, x: number, y: number) {
        super({radius, fill: "green", stroke: "black", x, y});
        this.velocity = Ball.getRandomVelocity();
    }

    private static getRandomVelocity() {
        return {
            x: Ball.randomIntFromInterval(-10, 10),
            y: 0 - Ball.randomIntFromInterval(4, 8),
        }
    }

    private static randomIntFromInterval(min, max) { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
}

type BrickOptions = {
    color: string,
    y: number,
    x: number,
    width: number,
    height: number,
}

class Brick extends Rectangle {
    private row: number;
    private column: number;

    constructor(options: BrickOptions, private coordinateConverter: GameMapToCanvasConverter) {
        super({fill: options.color, width: options.width, height: options.height});
        this.setPosition(options);
    }

    public setPosition(options: { x: number, y: number }): Movable {
        if (this.coordinateConverter) {
            const areaMapCoordinate = this.coordinateConverter.convertToAreaMapCoordinate(options);
            this.row = areaMapCoordinate.row;
            this.column = areaMapCoordinate.column;
        }
        return super.setPosition(options);
    }

    /**
     * returns an array of the grid positions of the blocks of the tetromino in absolute coords
     */
    public toAreaMapCoordinates(): GameMapCoordinates {
        return [{
            point: {
                row: this.row,
                column: this.column
            },
            artifact: this
        }];
    }
}

class BallMover {
    private balls: Ball[] = [];
    private shapeMover: ShapeMover;
    private coordinateConverter: GameMapToCanvasConverter;
    private movementReflector: MovementReflection;

    constructor(private blockSize: number, private areaMap: AreaMap) {
        this.shapeMover = new ShapeMover(blockSize);
        this.coordinateConverter = new GameMapToCanvasConverter(blockSize, blockSize);
        this.movementReflector = new MovementReflection(this.areaMap.dimensions.height * blockSize, this.areaMap.dimensions.width * blockSize);
    }

    public add(ball: Ball) {
        this.balls.push(ball);
    }

    public move() {
        this.balls.forEach(ball => {
            this.reflectUntilInside(ball);
        });
    }

    private reflectUntilInside(ball: Ball) {
        this.shapeMover.moveWithVelocity(ball, ball.velocity);
        if (!this.withinMapBoundaries(ball)) {
            const reflectedPosition = this.movementReflector.reflect(ball.position.x, ball.position.y, ball.velocity);
            ball.setPosition(reflectedPosition);
            if (!this.withinMapBoundaries(ball)) {
                this.reflectUntilInside(ball);
            }
        }
    }

    private withinMapBoundaries(ball: Ball) {
        const areaMapCoordinate = this.coordinateConverter.convertToAreaMapCoordinate(ball.position);
        return this.areaMap.isWithinMapBoundaries(areaMapCoordinate.row, areaMapCoordinate.column);
    }
}

class MovementReflection {
    constructor(private maxY, private maxX) {
    }

    reflect(x: number, y: number, velocity: Velocity = {x: 0, y: 0}) {
        let reflected = {x, y};
        if (y < 0) {
            reflected.y = Math.abs(y);
            velocity.y *= -1;
        } else if (y > this.maxY) {
            const difference = y - this.maxY
            reflected.y = this.maxY - difference;
            velocity.y *= -1;
        }

        if (x < 0) {
            reflected.x = Math.abs(x);
            velocity.x *= -1;
        } else if (x > this.maxX) {
            const difference = x - this.maxX;
            reflected.x = this.maxX - difference;
            velocity.x *= -1;
        }
        return reflected;
    }
}
