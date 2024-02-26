"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
require("reflect-metadata");
class Container {
    instances = new Map();
    bind(token, implementation) {
        this.instances.set(token, implementation);
    }
    resolve(target) {
        const args = Reflect.getMetadata('design:paramtypes', target) || [];
        const dependencies = args.map((token) => this.resolve(token));
        // if (!implementation) {
        //     throw new Error(`Dependency with token ${target} not found`);
        // }
        const implementation = this.instances.get(target);
        if (implementation && typeof implementation !== 'function') {
            // Already an instantiated object, return it
            return implementation;
        }
        else { // We need to construct the object
            return new target(...dependencies);
        }
    }
    register(token, implementation) {
        this.instances.set(token, new implementation()); // Store a new instance from constructor
    }
    // public register<T>(token: any | symbol, implementation: { new(...args: any[]): T } | T): void {
    //     if (typeof implementation === 'function') {
    //         this.instances.set(token, new implementation()); // Store a new instance from constructor
    //     } else {
    //         this.instances.set(token, implementation); // Store the existing instance
    //     }
    // }
    getAll(token) {
        const instances = [];
        for (const [key, value] of this.instances.get(token)) {
            if (key === token) {
                instances.push(value);
            }
        }
        return instances;
    }
    get(token) {
        return this.instances.get(token);
    }
    getData(data) {
        return data;
    }
}
exports.Container = Container;
