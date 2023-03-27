const colorSequenceValueMap = new Map<string, number>();
colorSequenceValueMap.set("red", 1);
colorSequenceValueMap.set("green", 2);
colorSequenceValueMap.set("blue", 3);
colorSequenceValueMap.set("yellow", 4);

const redBtn = document.getElementById("red") as HTMLButtonElement;
const greenBtn = document.getElementById("green") as HTMLButtonElement;
const blueBtn = document.getElementById("blue") as HTMLButtonElement;
const yellowBtn = document.getElementById("yellow") as HTMLButtonElement;
const sequencedButtons = {
    1: redBtn,
    2: greenBtn,
    3: blueBtn,
    4: yellowBtn
}

let blinkingLock = false;

const animationLengthInMS = 1_000;
const main = () => {

    const newGameBtn = document.getElementById("new-game");

    const NUMBER_OF_BUTTONS = 4;
    const gameState = new GameState(NUMBER_OF_BUTTONS, NUMBER_OF_BUTTONS);

    newGameBtn.addEventListener("click", () => {
        setLockButtonsBecauseOfBlinking(true);
        blink(yieldElements(gameState.nextLevel(), sequencedButtons));
        const nextLevelBtn = document.getElementById("next-level");
        nextLevelBtn.addEventListener("click", () => {
            console.log("next")
            setLockButtonsBecauseOfBlinking(true);
            blink(yieldElements(gameState.nextLevel(), sequencedButtons));
        })
    });


    redBtn.addEventListener("click", getColoredButtonEventListener("red", gameState));
    greenBtn.addEventListener("click", getColoredButtonEventListener("green", gameState));
    blueBtn.addEventListener("click", getColoredButtonEventListener("blue", gameState));
    yellowBtn.addEventListener("click", getColoredButtonEventListener("yellow", gameState));
}

function* yieldElements(sequence, buttons) {
    for (const sequenceElement of sequence) {
        yield buttons[sequenceElement];
    }
}

const blink = generator => {
    const generatedValue = generator.next();
    if (generatedValue.done) {
        setLockButtonsBecauseOfBlinking(false);
        return;
    }

    const element = generatedValue.value;

    setTimeout(() => {
        element.classList.add("blink");
        setTimeout(() => {
            element.classList.remove("blink");
            blink(generator);
        }, animationLengthInMS)
    }, 500);
}

const getColoredButtonEventListener = (color, gameState) => {
    return () => {
        const guessedValue = colorSequenceValueMap.get(color);
        if (!guessedValue) {
            throw "Something horrible went wrong";
        }
        gameState.guess(guessedValue);
    }
}

const setLockButtonsBecauseOfBlinking = (lock) => {
    blinkingLock = lock;
    redBtn.disabled = lock;
    greenBtn.disabled = lock;
    blueBtn.disabled = lock;
    yellowBtn.disabled = lock;
}

class GameState {
    correctSequence = [];
    currentGuessIndex = 0;

    sequenceMaxValue;

    constructor(sequenceLength, sequenceMaxValue) {
        this.sequenceMaxValue = sequenceMaxValue;
        // Subtract one, so that when we nextLevel it is automatically added
        this.correctSequence = this.generateSequence(sequenceLength - 1, this.sequenceMaxValue);
    }

    nextLevel() {
        this.correctSequence.push(this.randomInRange(1, this.sequenceMaxValue));
        this.currentGuessIndex = 0;
        return this.correctSequence;
    }

    guess(value) {
        const correctSequenceElement = this.correctSequence[this.currentGuessIndex];
        if (value !== correctSequenceElement) {
            console.log("Wrong Guess")
        } else {
            this.currentGuessIndex++;
            console.log("Correct");
            if (this.currentGuessIndex === this.correctSequence.length) {
                console.log("You win");
            }
        }
    }

    generateSequence(length, maxValue) {
        return Array(length).fill(0).map(() => this.randomInRange(1, maxValue));
    }

    randomInRange(min, max) { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min)
    };
}

main();
