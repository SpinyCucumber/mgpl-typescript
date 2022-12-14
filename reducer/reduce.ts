import { Composition, Expr, Mapping, Variable } from "../syntax";
import { singleDispatch } from "../utility";

/**
 * Variables and Mappings cannot be reduced.
 */
export const reduce = singleDispatch<Expr, Expr>([
    [Variable, expr => expr],
    [Mapping, expr => expr],
    [Composition, (expr: Composition) => {
        const first = reduce(expr.first);
        if (first instanceof Mapping) {
            const second = reduce(expr.second);
            return substitute(second)(first);
        }
        return expr;
    }],
]);

export const substitute: (expr: Expr) => (mapping: Mapping) => Expr = singleDispatch<Expr, (mapping: Mapping) => Expr>([
    [Composition, ({first, second}: Composition) => (mapping => 
        new Composition(substitute(first)(mapping), substitute(second)(mapping))
    )],
    [Mapping, (expr: Mapping) => (mapping => expr.map(value => substitute(value)(mapping)))],
    // If variable's side is defined by the mapping, substitute
    [Variable, (expr: Variable) => (mapping => {
        const { side } = expr;
        if (mapping.has(side)) return mapping.get(side);
        return expr;
    })],
]);

export function evaluate(expr: Expr, mapping: Mapping) {
    return reduce(substitute(expr)(mapping));
}