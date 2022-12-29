import { Position, Vector, BlockingQueue, directions } from "../utility";
import { Map, Set, Seq } from "immutable";

export type Value = any;

/**
 * A side is a vector.
 * The set of sides is closed under multiplication by -1;
 * i.e., every side has an opposite.
 */
export type Side = Vector;
export const sides = Set(directions);

/**
 * A tile is defined by a "program", which is executed once.
 * The environment is the set of actions available to the program,
 * which includes waiting on a value (pulling) or pushing a value to
 * a neighboring cell.
 */
export abstract class Tile {
    abstract process(environment: Environment): void
}

export interface Environment {
    pull: (side: Side) => Promise<Value>
    push: (side: Side, value: Value) => void
}

export interface CellOptions {
    tile: Tile;
}

class Cell {

    queues = Map(Seq(sides).map(side => ([side, new BlockingQueue<Value>()])));
    tile: Tile;

    constructor({ tile }: CellOptions) {
        this.tile = tile;
    }

    write(side: Side, value: Value): void {
        this.queues.get(side)?.enqueue(value);
    }

    read(side: Side): Promise<Value> {
        return this.queues.get(side)?.dequeue();
    }

}

export interface GridOptions {
    cells: Iterable<[Position, CellOptions]>;
}

export class Grid {

    // We use immutable.js to create a mapping between 2D coordinates and cells
    private cells: Map<Position, Cell>;

    constructor({ cells }: GridOptions) {
        this.cells = Map(Seq(cells).map(([position, options]) => ([position, new Cell(options)])));
    }

    start(): void {
        for (const [position, cell] of this.cells.entries()) {
            // Construct the environment for the process
            // pull dequeues a value from one of the cell's internal queue
            const pull = cell.read;
            // push writes a value to a neighboring cell
            const push = (side: Side, value: Value) => {
                const neighbor = this.cells.get(position.add(side));
                if (neighbor) neighbor.write(side.scale(-1), value);
            };
            // Start cell process
            cell.tile.process({ pull, push });
        }
    }

}