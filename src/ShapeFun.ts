import * as ShapeKind from "./ShapeKind";

export interface Circle {
    kind: typeof ShapeKind.Circle;
    radius: number;
}

export interface Square {
    kind: typeof ShapeKind.Square;
    sideLength: number;
}

export function area(shape: Circle | Square): number {
    if (shape.kind === ShapeKind.Circle) {
    // 'shape' has type 'Circle'
        return Math.PI * shape.radius ** 2;
    }
    // 'shape' has type 'Square'
    return shape.sideLength ** 2;
}


