"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShapeKind = __importStar(require("./ShapeKind"));
function area(shape) {
    if (shape.kind === ShapeKind.Circle) {
        // 'shape' has type 'Circle'
        return Math.PI * shape.radius ** 2;
    }
    // 'shape' has type 'Square'
    return shape.sideLength ** 2;
}
exports.area = area;
//# sourceMappingURL=ShapeFun.js.map