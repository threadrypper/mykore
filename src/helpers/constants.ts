export const BooleanMapping: Record<string, "true" | "false"> = {
    false: "false",
    no: "false",
    true: "true",
    yes: "true",
};

export const Operators = new Set([
    "!==",
    "!=",
    "===",
    "&&",
    "||",
    "==",
    ">=",
    "<=",
    "<",
    ">",
    "(",
    ")",
    "!",
]);

export const Falsys = new Set(["False", "false", "No", "no", "0", "''", "``", '""']);
export const Truthys = new Set(["True", "true", "Yes", "yes", "1"]);
export const EscapableCharacters = new Set(["${", "\\", "`"]);