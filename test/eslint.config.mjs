import globals from "globals";

export default [{
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.mocha,
        },
    },

    rules: {
        "no-unused-expressions": 0,
        "no-path-concat": 0,
        "no-console": 0,
    },
}];