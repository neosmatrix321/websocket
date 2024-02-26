
import 'reflect-metadata';
export class Container {
    private instances: Map<any | symbol, any> = new Map();
    public bind<T>(token: any | symbol, implementation: T): void {
        this.instances.set(token, implementation);
    }
    resolve<T>(target: any | symbol): T {
        const args = Reflect.getMetadata('design:paramtypes', target) || [];
        const dependencies = args.map((token: any | symbol) => this.resolve<any | symbol>(token));
        // if (!implementation) {
        //     throw new Error(`Dependency with token ${target} not found`);
        // }
        const implementation = this.instances.get(target);
        if (implementation && typeof implementation !== 'function') {
            // Already an instantiated object, return it
            return implementation as T;
        } else { // We need to construct the object
            return new target(...dependencies);
        }

    }
    public register<T>(token: any | symbol, implementation: { new(...args: any[]): T }): void {
        this.instances.set(token, new implementation()); // Store a new instance from constructor
    }
    // public register<T>(token: any | symbol, implementation: { new(...args: any[]): T } | T): void {
    //     if (typeof implementation === 'function') {
    //         this.instances.set(token, new implementation()); // Store a new instance from constructor
    //     } else {
    //         this.instances.set(token, implementation); // Store the existing instance
    //     }
    // }
    public getAll<T>(token: any | symbol): T[] {
        const instances = [];
        for (const [key, value] of this.instances.get(token)) {
            if (key === token) {
                instances.push(value);
            }
        }
        return instances;
    }
    public get<T>(token: any | symbol): T | undefined { // Return T or undefined
        return this.instances.get(token);
    }
    public getData<T>(data: any): T {
        return data as T;
    }

}
