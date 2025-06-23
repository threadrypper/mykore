import { Instruction } from "../../classes/instruction";
import { Task } from "../../classes/compiler";
export default class ExportInstruction extends Instruction {
    name = "$export";
    id = "$akoreExport";
    compile(task: Task): string {
        this.processNestedArguments(task);
        const [name, value] = task.argumentValues();
        return `exports${name ? `.${name}` : ""} = ${value}`;
    };
}