import { Instruction } from "../classes/instruction";
import { Task } from "../classes/compiler";
export default class CallInstruction extends Instruction {
    name: string;
    id: string;
    compile(task: Task): string;
}
