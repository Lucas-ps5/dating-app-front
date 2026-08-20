import { defineConfig } from "@hey-api/openapi-ts";

export const generateClient = ({ name }: { name: string }) => {
  return defineConfig({
    input: `./openapi/${name}.yaml`,
    output: {
      path: `./src/api/${name}`,
    },
    plugins: [
      "@hey-api/client-axios",
      "@hey-api/schemas",
      {
        name: "@hey-api/typescript",
        enums: "javascript",
      },
      {
        name: "@hey-api/sdk",
        operations: { strategy: "byTags" }
      },
    ],
  });
};

