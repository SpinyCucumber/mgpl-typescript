export interface SingleDispatchHandler<T> {
    type: new (...args: any[]) => T,
    handle(t: T): any,
}

/**
 * Generated by single dispatch functions when no compatible handler is found
 * for the argument type
 */
export class UnimplementedHandlerError extends Error {

    type: Function;

    constructor(type: Function, message) {
        super(message);
        this.type = type;
    }

}

/**
 * Creates a function which defers execution to other functions depending on the type of its argument.
 * The created function only accepts one argument, therefore "single dispatch".
 * @param handlers 
 * @returns 
 */
export function createSingleDispatch<T>(handlers: SingleDispatchHandler<T>[]) {

    const typeToHandler = new Map<Function, (t: T) => any>(handlers.map(({ type, handle }) => ([ type, handle ])));

    return (t: T) => {
        const type = t.constructor;
        const handler = typeToHandler.get(type);
        // If no handler is specified generate error
        if (handler === undefined) {
            throw new UnimplementedHandlerError(type, `Handler for type "${type.name}" not implemented.`);
        }
        return handler(t);
    }

}