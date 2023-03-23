import {KeyBindings} from "./key-bindings.js";

export abstract class Engine {
    protected readonly keyBinds = new KeyBindings();

    public abstract start();

    public abstract render();

    public abstract tick();

    public end() {
        this.keyBinds.disable();
    }

    public fireEvent(event: KeyboardEvent) {
        this.keyBinds.fireAction(event);
    }
}
