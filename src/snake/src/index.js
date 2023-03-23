import {SnakeEngine} from "./sneklis.js";

const main = () => {
    const engine = createEngine();
    engine.start();
}

const createEngine = () => {
    const blockSize = 30;
    const canvas = getCanvas(20, 10, blockSize)
    const engine = new SnakeEngine(canvas, {blockSize: 20});
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
