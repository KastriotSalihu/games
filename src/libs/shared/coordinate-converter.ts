import {Coordinate} from "./2D-game-map.js";

export class GameMapToCanvasConverter {

    constructor(private blockWidth: number, private blockHeight: number) {
    }

    public getGrid(coordinate: number, blockSize = this.blockWidth) {
        return coordinate / blockSize;
    }

    public getCoordinate(grid: number) {
        return grid * this.blockWidth;
    }

    public convertToAreaMapCoordinate(position: { x: number, y: number }): Coordinate | null {
        if (!position) {
            return null;
        }
        return {
            row: this.getGrid(position.y, this.blockHeight),
            column: this.getGrid(position.x)
        }
    }
}
