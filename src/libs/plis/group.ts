import { Position, Properties} from "./plis.js";
import Shape from "./shape.js";
import Collection from "./collection.js";

interface Options extends Position, Dimension, Properties {
}

type Dimension = {
    width: number,
    height: number,
}

class Group extends Shape {
    private collection: Collection<Shape>;

    constructor(options: Partial<Options>, members: Shape[]) {
        super(options);
        this.collection = new Collection(options, members);
    }

    public ungroup(relativePosition?: Position): Shape[] {
        const shiftedPosition = this.shiftPosition(relativePosition);
        this.collection.getShapes().forEach(member => {
            const absolutePosition = member.getAbsolutePosition(shiftedPosition);
            member.setPosition(absolutePosition);
        })
        const removedMembers = this.collection.getShapes();
        this.collection.clear();
        return removedMembers;
    }

    public draw(ctx: CanvasRenderingContext2D, relativePosition?: Position) {
        const shiftedPosition = this.shiftPosition(relativePosition);
        this.collection.draw(ctx, shiftedPosition);
    }

    public add(member: Shape) {
        this.collection.add(member);
    }

    public pop() {
        this.collection.pop();
    }

    public getMembersLength() {
        return this.collection.getShapes().length;
    }

    public getShapes() {
        return this.collection.getShapes();
    }
}

export default Group;
