"use strict";
/*
"use strict";
import 'reflect-metadata';

// Simplified interface for injections
interface InjectableDependency {
  token: any | symbol;
}

// Injectable Decorator
export function Injectable(): Function {
  return (target: any) => {
    // Store metadata for dependencies
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    const dependencies: InjectableDependency[] = paramTypes.map((paramType: any, index: number) => ({
      index,
      token: paramType, // Assuming dependencies are classes with unique tokens
    }));
    Reflect.defineMetadata('Injectable:dependencies', dependencies, target);
  };
}

// Inject Decorator
export function Inject(token: any | symbol): any {
  return (target: any, key: string, index: number) => {
    // Create or get array of dependencies
    const dependencies = Reflect.getMetadata('Injectable:dependencies', target) || [];

    // Update dependency with provided token
    dependencies[index] = { index, token };
    Reflect.defineMetadata('Injectable:dependencies', dependencies, target);
  };
}

*/ 
