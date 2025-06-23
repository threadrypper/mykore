import { ArgumentTypes, Instruction } from "../../classes/instruction";
import { toValidVarName } from "../../helpers/to_valid_var_name";
import { Task } from "../../classes/compiler";
export default class ImportInstruction extends Instruction {
    name = "$import";
    id = "$akoreImport";
    compile(task: Task): string {
        this.validateAndProcessArguments(task.arguments, 1, ArgumentTypes.NONE, ArgumentTypes.NONE);
        this.processNestedArguments(task);
        let [module, key = module] = task.argumentValues();
        if (key === module) {
            this.compiler.setVariable(module!);
            this.compiler.setImport(module!);
        }
        else if (/,/.test(key!)) {
            const keys = key!.split(",");
            for (let i = 0; i < keys.length; i++) {
                const e = keys[i];
                if (e) {
                    if (/ as /.test(e)) {
                        let [k, s] = e.split(" as ", 2);
                        keys[i] = toValidVarName(k!) + ":" + toValidVarName(s!);
                        this.compiler.setVariable(s!);
                    }
                    this.compiler.setVariable(e);
                    keys[i] = toValidVarName(e);
                }
            }
            this.compiler.setImport(module!, ...keys);
            return "";
        }
        else {
            this.compiler.setVariable(module!);
        }
        return toValidVarName(module!);
    };
}