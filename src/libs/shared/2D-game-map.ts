import {Movable} from "../plis/index.js";
import {GameMapToCanvasConverter} from "./coordinate-converter.js";

export type Coordinate = { row: number, column: number };
export type GameMapCoordinates = Array<{ point: Coordinate, artifact: Movable }>;

export class GameMap<T> {
    // map[0] is the bottom most row
    protected readonly occupationMap: Array<Array<T | null>>;

    constructor(protected height: number, protected width: number, protected blockSize: number) {
        this.occupationMap = this.getNEmptyRows(height);
    }

    public occupyCoordinates(coordinates: Array<{ point: Coordinate, artifact: T }>): void {
        for (const coordinate of coordinates) {
            if (coordinate) {
                this.occupationMap[coordinate.point.row][coordinate.point.column] = coordinate.artifact;
            }
        }
    }

    public unoccupyCoordinates(coordinates: Array<Coordinate>): void {
        for (const coordinate of coordinates) {
            if (coordinate) {
                this.occupationMap[coordinate.row][coordinate.column] = null;
            }
        }
    }

    public getAt(row: number, column: number): T {
        return this.occupationMap[row][column];
    }

    public isOccupied(row: number, column: number): boolean {
        return Boolean(this.occupationMap[row][column]);
    }

    public isWithinMapBoundaries(row, column): boolean {
        if (row < 0 ||
            column < 0) {
            return false;
        }

        return row < this.height && column < this.width;
    }

    public isOutsideMapBoundaries(row: number, column: number): boolean {
        return !this.isWithinMapBoundaries(row, column);
    }

    public static getCoordinates(shapes: Movable[], relativePosition: { row: number, column: number }, blockSize: number): GameMapCoordinates {
        const coordinateConverter = new GameMapToCanvasConverter(blockSize, blockSize);
        const {row: tetrominoRow, column: tetrominoColumn} = relativePosition;
        return shapes.map(shape => ({
            point: {
                row: tetrominoRow + coordinateConverter.getGrid(shape.position.y),
                column: tetrominoColumn + coordinateConverter.getGrid(shape.position.x),
            },
            artifact: shape
        }))
    }

    protected getNEmptyRows(n: number) {
        return Array(n).fill(null).map(() => this.getEmptyRow());
    }

    protected getEmptyRow(): T[] {
        return Array(this.width).fill(null)
    }

}
