import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class PrintInstruction extends Instruction {
    name: string;
    id: string;
    compile(task: Task): `console.log(${string})`;
}
