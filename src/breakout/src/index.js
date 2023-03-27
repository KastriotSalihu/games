import {BreakoutEngine} from "./breaklis.js";

const main = () => {
    const engine = createEngine();
    engine.start();
}

const createEngine = () => {
    const blockSize = 50;
    const rows = 10;
    const columns = 14;
    const canvas = getCanvas(rows, columns, blockSize)
    const engine = new BreakoutEngine(canvas, {blockSize, rows, columns});
    addKeyBoardEvents(engine);
    return engine;
}

const addKeyBoardEvents = (engine) => {
    document.addEventListener('keydown', (event) => {
        engine.fireEvent(event);
        engine.render();
    }, false);
}

const getCanvas = (rows, columns, blockSize) => {
    const canvas = document.getElementById("canvas");
    canvas.height = rows * blockSize;
    canvas.width = columns * blockSize;
    return canvas;
}

main();
