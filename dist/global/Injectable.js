(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "reflect-metadata"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Inject = exports.Injectable = void 0;
    require("reflect-metadata");
    // Injectable Decorator
    function Injectable() {
        return function (target) {
            // Store metadata for dependencies
            var paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
            var dependencies = paramTypes.map(function (paramType, index) { return ({
                index: index,
                token: paramType, // Assuming dependencies are classes with unique tokens
            }); });
            Reflect.defineMetadata('Injectable:dependencies', dependencies, target);
        };
    }
    exports.Injectable = Injectable;
    // Inject Decorator
    function Inject(token) {
        return function (target, key, index) {
            // Create or get array of dependencies
            var dependencies = Reflect.getMetadata('Injectable:dependencies', target) || [];
            // Update dependency with provided token
            dependencies[index] = { index: index, token: token };
            Reflect.defineMetadata('Injectable:dependencies', dependencies, target);
        };
    }
    exports.Inject = Inject;
});
