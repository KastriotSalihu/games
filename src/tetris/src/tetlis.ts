import {Canvas, Movable, Group, Rectangle, Shape} from "../../libs/plis/index.js";
import {Engine} from "../../libs/shared/engine.js";
import {GameMapCoordinates, GameMap} from "../../libs/shared/2D-game-map.js";
import {PlayArea} from "../../libs/shared/play-area.js";
import {GameMapToCanvasConverter} from "../../libs/shared/coordinate-converter.js";

type TetrominoTemplate = string[];
type BlockOptions = {
    size: number,
    fill: string
}

type EngineProperties = {
    blockSize: number
}

enum Direction {
    ArrowUp = "ArrowUp",
    ArrowDown = "ArrowDown",
    ArrowLeft = "ArrowLeft",
    ArrowRight = "ArrowRight",
}

const randomRGB = (min = 0, max = 255) => { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
};

const randomColor = () => {
    return `rgb(${randomRGB()}, ${randomRGB()}, ${randomRGB()})`
}

export class TetrisEngine extends Engine {
    private readonly playArea: TetrisPlayArea;
    private readonly areaMap: AreaMap;
    private readonly fixHelper = new FillSkylineHelper();
    declare keyBinds;

    private lifecycleIntervalId: ReturnType<typeof setInterval>
    private paused = false;

    private movements = {
        [Direction.ArrowUp]: {x: 0, y: -1, opposite: () => this.movements[Direction.ArrowDown]},
        [Direction.ArrowDown]: {x: 0, y: 1, opposite: () => this.movements[Direction.ArrowUp]},
        [Direction.ArrowLeft]: {x: -1, y: 0, opposite: () => this.movements[Direction.ArrowRight]},
        [Direction.ArrowRight]: {x: 1, y: 0, opposite: () => this.movements[Direction.ArrowLeft]}
    };

    constructor(canvas: HTMLCanvasElement, private tetrominoFactory: ITetrominoFactory, private properties: EngineProperties) {
        super();
        this.playArea = new TetrisPlayArea(new Canvas(canvas));
        this.areaMap = new AreaMap(Math.floor(canvas.height / properties.blockSize), Math.floor(canvas.width / properties.blockSize), properties.blockSize);

        this.keyBinds.map("KeyR", "Rotate");
        this.keyBinds.setAction("Rotate", (event) => this.fireRotate(event));

        this.keyBinds.map("ArrowDown", "Move");
        this.keyBinds.map("ArrowLeft", "Move");
        this.keyBinds.map("ArrowRight", "Move");
        this.keyBinds.setAction("Move", event => this.fireMove(event));

        this.keyBinds.map("KeyP", "Pause");
        this.keyBinds.setAction("Pause", (event) => this.firePause(event));

        this.keyBinds.map("KeyT", "Fix");
        this.keyBinds.setAction("Fix", (event) => this.fireFix(event));
    }

    public override render() {
        this.playArea.render();
    }

    public override start() {
        this.nextTetromino();
        this.startLifecycle();
    }

    public override tick(): void {
        const successfulMove = this.attemptToMoveTetromino(this.playArea.actionable, Direction.ArrowDown);
        if (!successfulMove) {
            this.nextTetromino();
        }
        this.render();
    }

    public override end() {
        super.end();
        clearInterval(this.lifecycleIntervalId);
        this.playArea.actionable = null;
        console.log("Game Over");
    }

    public nextTetromino() {
        this.addNextTetromino(this.tetrominoFactory);
    }

    private addNextTetromino(tetrominoFactory: ITetrominoFactory) {
        this.placePreviousTetromino();

        const tetromino = tetrominoFactory
            .getNext({fill: randomColor(), size: this.properties.blockSize});

        this.addTetrominoOrEndGame(tetromino);
    }

    private addTetrominoOrEndGame(tetromino: Tetromino) {
        if (this.areaMap.isValidPosition(tetromino.toAreaMapCoordinates())) {
            this.playArea.add(tetromino.getDrawable());
            this.playArea.actionable = tetromino;
        } else {
            this.end();
        }
    }

    private fireMove(event: KeyboardEvent) {
        const pressedKey = event.code;
        const tetromino = this.playArea.actionable;
        this.attemptToMoveTetromino(tetromino, Direction[pressedKey]);
    }

    private fireRotate(event: KeyboardEvent) {
        const tetromino = this.playArea.actionable;
        const clockwise = !event.shiftKey;
        this.attemptToRotateTetromino(tetromino, clockwise);
    }

    private firePause(_: KeyboardEvent) {
        if (this.paused) {
            this.unpauseGame()
        } else {
            this.pauseGame();
        }
    }

    private unpauseGame() {
        this.paused = false;
        this.startLifecycle();
        this.keyBinds.enable();
        console.log("Game Unpaused");
    }

    private pauseGame() {
        this.paused = true;
        clearInterval(this.lifecycleIntervalId);
        this.keyBinds.disable();
        console.log("Game Paused");
    }

    private fireFix(_: KeyboardEvent) {
        const template = this.fixHelper.generateTetrominoTemplateToFillEmptySpaces(this.areaMap.getOccupationMap());
        if (template.length > 0) {
            this.playArea.remove(this.playArea.actionable.getDrawable());
            const factory = new CustomizableTetrominoFactory(template);
            this.playArea.actionable = null;
            this.addNextTetromino(factory);
        }
    }

    private startLifecycle() {
        this.lifecycleIntervalId = setInterval(() => {
            this.tick();
        }, 400);
    }

    private attemptToMoveTetromino(tetromino: Tetromino, direction: Direction): boolean {
        let movedSuccessfully = true;
        tetromino.move(this.movements[direction])
        const isValidPosition = this.areaMap.isValidPosition(tetromino.toAreaMapCoordinates());
        if (!isValidPosition) {
            tetromino.move(this.movements[direction].opposite());
            movedSuccessfully = false;
        }
        return movedSuccessfully;
    }

    private attemptToRotateTetromino(tetromino: Tetromino, clockwise: boolean): boolean {
        let rotatedSuccessfully = true;
        // TODO: if overlapping is avoidable by moving the artifact after rotation, moveInDirection the artifact
        tetromino.rotate(clockwise);
        const isValidPosition = this.areaMap.isValidPosition(tetromino.toAreaMapCoordinates());
        if (!isValidPosition) {
            tetromino.rotate(!clockwise);
            rotatedSuccessfully = false;
        }
        return rotatedSuccessfully;
    }

    private placePreviousTetromino = () => {
        const activeTetromino = this.playArea.actionable;
        if (activeTetromino) {
            const areaMapCoordinates = activeTetromino.toAreaMapCoordinates();
            this.areaMap.occupyCoordinates(areaMapCoordinates);
            this.removeTetromino(activeTetromino);
            this.removeFilledRows();
        }
    }

    private removeTetromino(tetromino: Tetromino) {
        const shapes = tetromino.ungroupShapes();
        this.playArea.remove(tetromino.getDrawable());
        this.playArea.addShapes(shapes);
    }

    private removeFilledRows() {
        const deletedShapes = this.areaMap.removeFilledRows();
        this.playArea.removeShapes(deletedShapes);
    }

}

class TetrisPlayArea extends PlayArea {
    private _actionable: Tetromino;

    public get actionable(): Tetromino {
        return this._actionable;
    }

    public set actionable(value: Tetromino) {
        this._actionable = value;
    }
}

class AreaMap extends GameMap<Movable> {
    // map[0] is the top most row
    declare occupationMap: Array<Array<Movable | null>>;

    constructor(height: number, width: number, blockSize: number) {
        super(height, width, blockSize);
    }

    public isValidPosition(tetrominoGrid: GameMapCoordinates): boolean {
        for (const gridElement of tetrominoGrid) {
            if (this.isOutsideMapBoundaries(gridElement.point.row, gridElement.point.column) ||
                this.isOccupied(gridElement.point.row, gridElement.point.column)) {
                return false;
            }
        }
        return true;
    }

    public removeFilledRows(): Movable[] {
        const filledRows = this.findFilledRows();
        const deletedShapes = filledRows.flatMap(filledRow => filledRow.row);
        filledRows.forEach(({index}) => {
            this.moveRows(index - 1);
        })
        this.removeFilledRowsAndInsertEmptyOnes(filledRows.length);
        return deletedShapes;
    }

    public getOccupationMap() {
        return this.occupationMap;
    }

    private findFilledRows(): Array<{ row: Array<Movable | null>, index: number }> {
        return this.occupationMap
            .map((row, index) => ({
                index, row
            }))
            .filter(({row}) => AreaMap.isRowFilled(row));
    }

    private static isRowFilled(row: Array<Movable | null>) {
        return row.every(cell => cell != null)
    }

    private moveRows(startIndex: number) {
        for (let i = startIndex; i >= 0; i--) {
            const row = this.occupationMap[i];
            row.forEach(cell => {
                if (cell != null) {
                    cell.move({x: 0, y: this.blockSize});
                }
            })
        }
    }

    private removeFilledRowsAndInsertEmptyOnes(numberOfRowsToInsert) {
        this.occupationMap = this.occupationMap.filter(row => row.some(cell => cell === null));
        this.occupationMap.splice(0, 0, ...this.getNEmptyRows(numberOfRowsToInsert))
    }

}

class FillSkylineHelper {

    public generateTetrominoTemplateToFillEmptySpaces(occupationMap: Array<Array<Movable | null>>) {
        const rowWidth = occupationMap[0].length;
        let fillableRowCells = Array(rowWidth).fill(0).map((_, index) => index);
        const tetrominoTemplate = [];

        for (let i = FillSkylineHelper.findFirstNonEmptyRow(occupationMap); i < occupationMap.length; i++) {
            const remainingPotentialColumnIndexes = [];
            let rowTetrominoTemplate = FillSkylineHelper.getEmptyRowTemplate(rowWidth);
            for (let j = 0; j < fillableRowCells.length; j++) {
                const index = fillableRowCells[j];
                if (occupationMap[i][index] === null) {
                    remainingPotentialColumnIndexes.push(index);
                    // TODO: Refactor the tetromino template logic into a dedicated class
                    rowTetrominoTemplate = FillSkylineHelper.replaceAt(rowTetrominoTemplate, index, "x");
                }
            }
            tetrominoTemplate.push(rowTetrominoTemplate);
            fillableRowCells = remainingPotentialColumnIndexes;
        }
        return tetrominoTemplate;
    }

    private static replaceAt(string, index, replacement) {
        return string.substring(0, index) + replacement + string.substring(index + replacement.length);
    }

    private static getEmptyRowTemplate(rowWidth) {
        return Array(rowWidth).join(" ");
    }

    private static findFirstNonEmptyRow(occupationMap: Array<Array<Movable | null>>) {
        let i = 0;
        for (; i < occupationMap.length; i++) {
            const row = occupationMap[i];
            const hasNonNullCell = row.some(cell => cell !== null);
            if (hasNonNullCell) {
                return i;
            }
        }
        return i;
    }
}

interface ITetromino {
    move(position: { x: number, y: number }): Tetromino;

    rotate(clockwise: boolean): Tetromino;

    toAreaMapCoordinates(): GameMapCoordinates;

    getDrawable(): Movable;
}

export class Tetromino implements ITetromino {
    private readonly shape: Group = new Group({x: 0, y: 0}, []);
    private readonly tetrominoGrid: TetrominoGrid;
    private readonly coordinateConverter: GameMapToCanvasConverter

    constructor(private options: BlockOptions, template: TetrominoTemplate) {
        const parser = new TetrominoTemplateParser();
        this.coordinateConverter = new GameMapToCanvasConverter(options.size, options.size);
        this.tetrominoGrid = parser.getTetrominoGrid(template, options);
        this.addGridShapes();
        this.setBlockPositions();
    }

    public move(position: { x: number, y: number }): Tetromino {
        this.shape.move(this.translateMovementToShape(position));
        return this;
    }

    /**
     * returns an array of the grid positions of the blocks of the tetromino in absolute coords
     */
    public toAreaMapCoordinates(): GameMapCoordinates {
        const relativePosition = {row: this.row, column: this.column};
        return AreaMap.getCoordinates(this.shape.getShapes(), relativePosition, this.options.size);
    }

    public rotate(clockwise: boolean) {
        this.tetrominoGrid.rotate(clockwise);
        this.setBlockPositions();
        return this;
    }

    public getDrawable(): Movable {
        return this.shape;
    }

    private setBlockPositions() {
        this.tetrominoGrid.iterateShapes((shape, row, column) => {
            const y = this.coordinateConverter.getCoordinate(row);
            shape.setPosition({
                y,
                x: this.coordinateConverter.getCoordinate(Number(column))
            })
        })
    }

    public ungroupShapes(): Movable[] {
        return this.shape.ungroup();
    }

    private addGridShapes() {
        this.tetrominoGrid.iterateShapes((shape) => {
            this.shape.add(shape);
        })
    }

    private translateMovementToShape(position: { x: number, y: number }) {
        return {
            x: position.x * this.options.size,
            y: position.y * this.options.size
        }
    }

    private get row() {
        return this.coordinateConverter.getGrid(this.shape.position.y);
    }

    private get column() {
        return this.coordinateConverter.getGrid(this.shape.position.x);
    }
}

// TETROMINO BLOCK STRUCTURING
class TetrominoTemplateParser {

    defaultBlockOptions = {
        size: 20,
        fill: "orange"
    }

    /**
     * use x to denote a filled block
     * leave empty space for empty space
     * e.g.
     * "x "
     * "x "
     * "xx"
     * would return a TetrominoGrid with rectangles in the artifact of the L tetromino
     * @param template
     * @param options properties to pass to the square that draws the shapes
     */
    public getTetrominoGrid(template: TetrominoTemplate, options: BlockOptions): TetrominoGrid {
        const matrix = template
            .map(line => line.split("")
                .map(ch => ch === "x" ? this.getNewBlock(options) : null));
        return new TetrominoGrid(matrix);
    }

    private getNewBlock(options: BlockOptions) {
        const blockOptions = {
            ...this.defaultBlockOptions,
            ...options
        }
        return new Rectangle({width: blockOptions.size, height: blockOptions.size, ...blockOptions});
    }
}

class TetrominoGrid {

    constructor(private matrix: Array<Array<Shape | null>>) {
    }

    public iterateShapes(callback: (cell: Shape, row: number, column: number) => void) {
        for (let row = 0; row < this.matrix.length; row++) {
            for (let column = 0; column < this.matrix[row].length; column++) {
                const shape = this.matrix[row][column];
                if (!shape) {
                    continue;
                }
                callback(shape, row, column);
            }
        }
    }

    public rotate(clockwise: boolean) {
        this.matrix = this.getRotatedGrid(clockwise);
    }

    public getRotatedGrid(clockwise: boolean) {
        const rotatedGrid = []
        const m = this.matrix.length;
        const n = this.matrix[0].length;
        const orientedTraverser = (clockwise ? this.clockwiseTraverser : this.counterclockwiseTraverser).bind(this);

        for (let i = 0; i < n; i++) {
            rotatedGrid[i] = [];
            for (let j = 0; j < m; j++) {
                rotatedGrid[i][j] = orientedTraverser(i, j);
            }
        }
        return rotatedGrid;
    }

    private clockwiseTraverser(row: number, column: number) {
        const numberOfColumns = this.matrix.length;
        return this.matrix[numberOfColumns - 1 - column][row]
    }

    private counterclockwiseTraverser(row: number, column: number) {
        const numberOfRows = this.matrix[0].length;
        return this.matrix[column][numberOfRows - 1 - row];
    }
}

// FACTORY
export interface ITetrominoFactory {
    getNext(options: BlockOptions): Tetromino;
}

export class TetrominoFactory implements ITetrominoFactory {

    private tetrominoTemplates = [];

    constructor() {
        const I_tetromino = ["xxxx"];

        const J_tetromino = [
            "x  ",
            "xxx"
        ];

        const L_tetromino = [
            "  x",
            "xxx"
        ];

        const O_tetromino = [
            "xx",
            "xx"
        ];

        const S_tetromino = [
            " xx",
            "xx "
        ];

        const T_tetromino = [
            " x ",
            "xxx"
        ];

        const Z_tetromino = [
            "xx ",
            " xx"
        ];

        this.tetrominoTemplates.push(I_tetromino);
        this.tetrominoTemplates.push(J_tetromino);
        this.tetrominoTemplates.push(L_tetromino);
        this.tetrominoTemplates.push(O_tetromino);
        this.tetrominoTemplates.push(S_tetromino);
        this.tetrominoTemplates.push(T_tetromino);
        this.tetrominoTemplates.push(Z_tetromino);
    }

    public getNext(options: BlockOptions): Tetromino {
        const template = this.getRandomTemplate();
        return new Tetromino(options, template);
    }

    private getRandomTemplate(): string[] {
        return this.tetrominoTemplates[Math.floor(Math.random() * this.tetrominoTemplates.length)];
    }
}

class CustomizableTetrominoFactory implements ITetrominoFactory {

    constructor(private template: string[]) {
    }

    public getNext(options: BlockOptions): Tetromino {
        return new Tetromino(options, this.template);
    }
}
