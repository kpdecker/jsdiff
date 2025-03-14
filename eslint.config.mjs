import globals from "globals";
import babelParser from "@babel/eslint-parser";

export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: babelParser,
        },

        rules: {
            // Possible Errors //
            //-----------------//
            "comma-dangle": [2, "never"],
            "no-cond-assign": [2, "except-parens"],
            "no-console": 1, // Allow for debugging
            "no-constant-condition": 2,
            "no-control-regex": 2,
            "no-debugger": 1, // Allow for debugging
            "no-dupe-args": 2,
            "no-dupe-keys": 2,
            "no-duplicate-case": 2,
            "no-empty": 2,
            "no-empty-character-class": 2,
            "no-ex-assign": 2,
            "no-extra-boolean-cast": 2,
            "no-extra-parens": [2, "functions"],
            "no-extra-semi": 2,
            "no-func-assign": 2,
            "no-invalid-regexp": 2,
            "no-irregular-whitespace": 2,
            "no-negated-in-lhs": 2,
            "no-obj-calls": 2,
            "no-regex-spaces": 2,
            "no-sparse-arrays": 0,
            "no-unreachable": 1, // Optimizer and coverage will handle/highlight this and can be useful for debugging
            "use-isnan": 2,
            "valid-jsdoc": 0,
            "valid-typeof": 2,

            // Best Practices //
            //----------------//
            "block-scoped-var": 0,
            complexity: 0,
            "consistent-return": 0,
            curly: 2,
            "default-case": 1,

            "dot-notation": [2, {
                allowKeywords: false,
            }],

            eqeqeq: 0,
            "guard-for-in": 1,
            "no-alert": 2,
            "no-caller": 2,
            "no-div-regex": 1,
            "no-else-return": 0,
            "no-eq-null": 0,
            "no-eval": 2,
            "no-extend-native": 2,
            "no-extra-bind": 2,
            "no-fallthrough": 2,
            "no-floating-decimal": 2,
            "no-implied-eval": 2,
            "no-iterator": 2,
            "no-labels": 2,
            "no-lone-blocks": 2,
            "no-loop-func": 0,
            "no-multi-spaces": 2,
            "no-multi-str": 1,
            "no-native-reassign": 2,
            "no-new": 2,
            "no-new-func": 2,
            "no-new-wrappers": 2,
            "no-octal": 2,
            "no-octal-escape": 2,
            "no-param-reassign": 0,
            "no-process-env": 2,
            "no-proto": 2,
            "no-redeclare": 2,
            "no-return-assign": 2,
            "no-script-url": 2,
            "no-self-compare": 2,
            "no-sequences": 2,
            "no-throw-literal": 2,
            "no-unused-expressions": 2,
            "no-void": 0,
            "no-warning-comments": 1,
            "no-with": 2,
            radix: 2,
            "vars-on-top": 0,
            "wrap-iife": 2,
            yoda: 0,

            // Strict //
            //--------//
            strict: 0,

            // Variables //
            //-----------//
            "no-catch-shadow": 2,
            "no-delete-var": 2,
            "no-label-var": 2,
            "no-shadow": 0,
            "no-shadow-restricted-names": 0,
            "no-undef": 2,
            "no-undef-init": 2,
            "no-undefined": 0,

            "no-unused-vars": [2, {
                vars: "all",
                args: "after-used",
            }],

            "no-use-before-define": [2, "nofunc"],

            // Node.js //
            //---------//
            "no-mixed-requires": 0, // Others left to environment defaults

            // Stylistic //
            //-----------//
            indent: 0,
            "brace-style": [2, "1tbs", {
                allowSingleLine: true,
            }],

            camelcase: 2,

            "comma-spacing": [2, {
                before: false,
                after: true,
            }],

            "comma-style": [2, "last"],
            "consistent-this": [1, "self"],
            "eol-last": 2,
            "func-names": 0,
            "func-style": [2, "declaration"],

            "key-spacing": [2, {
                beforeColon: false,
                afterColon: true,
            }],

            "max-nested-callbacks": 0,
            "new-cap": 2,
            "new-parens": 2,
            "newline-after-var": 0,
            "no-array-constructor": 2,
            "no-continue": 0,
            "no-inline-comments": 0,
            "no-lonely-if": 2,
            "no-mixed-spaces-and-tabs": 2,
            "no-multiple-empty-lines": 0,
            "no-nested-ternary": 1,
            "no-new-object": 2,
            "no-spaced-func": 2,
            "no-ternary": 0,
            "no-trailing-spaces": 2,
            "no-underscore-dangle": 0,
            "one-var": 0,
            "operator-assignment": 0,
            "padded-blocks": 0,

            "quote-props": [2, "as-needed", {
                keywords: true,
            }],

            quotes: [2, "single", "avoid-escape"],
            semi: 2,

            "semi-spacing": [2, {
                before: false,
                after: true,
            }],

            "sort-vars": 0,
            "space-before-blocks": [2, "always"],

            "space-before-function-paren": [2, {
                anonymous: "never",
                named: "never",
            }],

            "space-in-brackets": 0,
            "space-in-parens": [2, "never"],
            "space-infix-ops": 2,
            "space-unary-ops": 2,
            "spaced-comment": [2, "always"],
            "wrap-regex": 1,
            "no-var": 2,
        },
    },
    {
        files: ['test/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },
        rules: {
            "no-unused-expressions": 0, // Needs disabling to support Chai `.to.be.undefined` etc syntax
            "no-path-concat": 0,
            "no-console": 0,
        },
    }
];