export class KeyBindings {
    private mappings = new Map<string, string>();
    private actions = new Map<string, (event: KeyboardEvent) => any>();
    private disabled = false;

    public map(keyCode: string, action: string) {
        this.mappings.set(keyCode, action);
    }

    public setAction(action: string, callback: (event: KeyboardEvent) => any) {
        this.actions.set(action, callback);
    }

    public fireAction(event: KeyboardEvent) {
        const pressedKey = event.code;
        const action = this.mappings.get(pressedKey);

        if (this.disabled) {
            if (action !== "Pause") {
                return;
            }
        }

        if (action) {
            const actionCallback = this.actions.get(action);
            actionCallback(event)
        }
    }

    public disable() {
        this.disabled = true;
    }

    public enable() {
        this.disabled = false;
    }
}
