import xo from "xo";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    xo.xoToEslintConfig([{ space: 4, prettier: "compat" }]),
    eslintConfigPrettier,
    {
        rules: {
            "unicorn/prefer-event-target": "off",
        },
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
