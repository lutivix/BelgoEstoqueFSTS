// eslint.config.mjs
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import typescriptParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier"; // Novo plugin

// Configurações estendidas diretamente no flat config
const eslintRecommendedConfig = {
  rules: {
    // Regras do eslint:recommended
    // 🛑 Código mais limpo e sem variáveis não utilizadas
    "no-unused-vars": "warn",

    // 🚨 Evita logs desnecessários no código
    "no-console": "warn",
    // Adicione outras regras do "eslint:recommended" se necessário
  },
};

const typescriptRecommendedConfig = {
  plugins: {
    "@typescript-eslint": typescriptPlugin,
    import: importPlugin,
    prettier: prettierPlugin, // Adiciona o plugin prettier
  },
  rules: {
    // 🔍 TypeScript e boas práticas
    "@typescript-eslint/explicit-function-return-type": "warn", // Incentiva a definir retornos de funções
    "@typescript-eslint/no-explicit-any": "warn", // Evita uso indiscriminado de "any"
    "@typescript-eslint/no-unused-vars": "warn", // Variáveis TypeScript não utilizadas
    // Adicione outras regras do "plugin:@typescript-eslint/recommended" se necessário
  },
};

export default [
  {
    files: ["backend/**/*.ts", "frontend/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser, // Definindo o parser dentro de languageOptions
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      import: importPlugin,
      prettier: prettierPlugin, // Adiciona o plugin prettier
    },
    // Configurações estendidas diretamente
    ...eslintRecommendedConfig,
    ...typescriptRecommendedConfig,
    rules: {
      ...eslintRecommendedConfig.rules,
      ...typescriptRecommendedConfig.rules,

      // 📌 Melhora a legibilidade e evita códigos sem sentido
      curly: "error", // Sempre usar chaves em blocos de if/else/loops
      eqeqeq: ["error", "always"], // Exige === ao invés de ==
      "no-else-return": "error", // Remove retornos desnecessários em else

      // 🔥 Padrões de escrita para deixar o código mais bonito
      //quotes: off, // Usa aspas duplas
      semi: ["error", "always"], // Exige ponto e vírgula
      indent: ["error", 2], // Indentação com 2 espaços
      //"comma-dangle": off, // Vírgula no final de objetos e arrays multilinha

      // ⚡ Melhoras de performance e segurança
      "no-eval": "error", // Evita eval() por ser inseguro
      "no-var": "error", // Sempre usar let ou const ao invés de var
      "prefer-const": "error", // Prefere const quando possível
      "arrow-body-style": ["error", "as-needed"], // Remove {} desnecessários em arrow functions
      "object-shorthand": "error", // Incentiva { foo } ao invés de { foo: foo }

      // 🔥 Estilização do código
      "max-len": ["warn", { code: 140 }], // Linha de código não deve ultrapassar 120 caracteres
      "spaced-comment": ["error", "always"], // Espaço após "//" em comentários

      indent: "off",
      "prettier/prettier": [
        "error",
        {
          // Configura o Prettier diretamente
          singleQuote: false,
          trailingComma: "all",
          tabWidth: 2,
          useTabs: false,          
        },
      ],
      "linebreak-style": ["error", "unix"]
    },
  },
];
