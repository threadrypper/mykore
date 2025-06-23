const { Compiler } = require("./dist/classes/compiler");
const { BasicInstructions } = require("./dist/index");

const compiler = new Compiler();
Object.values(BasicInstructions).forEach((Instruction) => {
    const inst = new Instruction(compiler);
    compiler.addInstruction(inst);
})

const input = [
    "$var[msg;Mi mamá me mima.]",
    "$print[USER_MESSAGE_IS: $var[msg]]"
].join("\n");
compiler.setInput(input);

compiler.compile().then((output) => {
    console.log(output);
});