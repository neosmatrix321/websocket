import "reflect-metadata";
import { Container, injectable, inject } from "inversify";

const TYPES = {
    ClassA: Symbol.for("ClassA"),
    ClassB: Symbol.for("ClassB"),
    Main: Symbol.for("Main")
};

@injectable()
class ClassA {
    public value = "Wert aus Klasse A";
}
@injectable()
class ClassB {
    public value = "Wert aus Klasse B";
}

@injectable()
class Main {
    private classA: ClassA;
    private classB: ClassB;

    public constructor(
        @inject(TYPES.ClassA) classA: ClassA,
        @inject(TYPES.ClassB) classB: ClassB
    ) {
        this.classA = classA;
        this.classB = classB;
    }

    public logValues(): void {
        console.log(this.classA.value);
        console.log(this.classB.value);
    }
}

const container = new Container();
container.bind(TYPES.ClassA).to(ClassA);
container.bind(TYPES.ClassB).to(ClassB);
container.bind(TYPES.Main).to(Main);

const main = container.get<Main>(TYPES.Main);
main.logValues();
