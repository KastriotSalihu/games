import {Drawable, Position, Properties} from "./plis.js";

interface Options extends Position, Dimension, Properties {
}

type Dimension = {
    width: number,
    height: number,
}

class Collection<T extends Drawable> implements Drawable {
    protected members: Array<T> = [];

    constructor(options: Partial<Options>, members: T[]) {

        members.forEach(member => {
            this.add(member)
        })
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position): void {
        if (!ctx) {
            return;
        }
        this.members.forEach(member => {
            member.draw(ctx, relativePosition);
        });
    }

    public getShapes() {
        return this.members;
    }

    public pop() {
        this.members.pop();
    }

    public add(member: T) {
        this.members.push(member);
    }

    public clear() {
        this.members = [];
    }
}

export default Collection;
