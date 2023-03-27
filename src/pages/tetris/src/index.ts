import {TetrominoFactory, TetrisEngine, Tetromino, ITetrominoFactory} from "./tetlis.js";

const main = (): void => {
    const engine = createEngine();
    engine.start();
}

const createEngine = (): TetrisEngine => {
    const blockSize = 30;
    const canvas = getCanvas(20, 10, blockSize)
    const engine = new TetrisEngine(canvas, getTetrominoFactory(false), {blockSize});
    addKeyBoardEvents(engine);
    return engine;
}

const addKeyBoardEvents = (engine): void => {
    document.addEventListener('keydown', (event) => {
        if (event.code === "Space") {
            engine.nextTetromino();
        } else {
            engine.fireEvent(event);
        }
        engine.render();
    }, false);
}

const getCanvas = (rows: number, columns: number, blockSize: number): HTMLCanvasElement => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.height = rows * blockSize;
    canvas.width = columns * blockSize;
    return canvas;
}

const getTetrominoFactory = (random = false): ITetrominoFactory => {
    if (random) {
        return new RandomTetrominoFactory();
    } else {
        return new TetrominoFactory();
    }
}

class RandomTetrominoFactory implements ITetrominoFactory {

    getNext(options): Tetromino {
        const template = this.getRandomTemplate(4, 5, 4, 5);
        return new Tetromino(options, template);
    }

    getRandomTemplate(minRow, maxRow, minColumn, maxColumn) {
        const rows = this.randomIntFromInterval(minRow, maxRow);
        const template = [];
        for (let i = 0; i < rows; i++) {
            template.push(this.getRandomRowTemplate(minColumn, maxColumn));
        }
        return template;
    }

    getRandomRowTemplate(minColumn, maxColumn): string {
        let rowTemplate = "";
        const columns = this.randomIntFromInterval(minColumn, maxColumn);
        for (let j = 0; j < columns; j++) {
            const isBlock = this.randomBoolean();
            rowTemplate = rowTemplate.concat(isBlock ? "x" : " ");
        }
        return rowTemplate;
    }

    randomBoolean(): boolean {
        return Math.random() < 0.5;
    }

    randomIntFromInterval(min, max): number { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
}

main();
