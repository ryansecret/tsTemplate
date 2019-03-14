import * as ShapeKind from '../src/ShapeKind'
import {area,Square}  from '../src/ShapeFun'

describe("jest test",function () {
    it('func',function () {
        let shape: Square={
            sideLength:5,
            kind:ShapeKind.Square
        }
        expect(area(shape)).toBeGreaterThan(0)

    })
})


