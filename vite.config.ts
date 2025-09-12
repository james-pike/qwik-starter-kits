// vite.config.ts (root)
import { defineConfig, type UserConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json";

type PkgDep = Record<string, string>;
const { dependencies = {}, devDependencies = {} } = pkg as any as {
  dependencies: PkgDep;
  devDependencies: PkgDep;
  [key: string]: unknown;
};
errorOnDuplicatesPkgDeps(devDependencies, dependencies);

export default defineConfig(({ command, mode }): UserConfig => {
  return {
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    optimizeDeps: {
      exclude: [],
    },
    server: {
      headers: {
        "Cache-Control": "public, max-age=0",
      },
    },
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
    ssr: {
      noExternal: Object.keys(devDependencies || {}), // Bundle dev deps for Edge
    },
  };
});

// *** utils ***
function errorOnDuplicatesPkgDeps(devDependencies: PkgDep, dependencies: PkgDep) {
  const duplicateDeps = Object.keys(devDependencies).filter((dep) => dependencies[dep]);
  const qwikPkg = Object.keys(dependencies).filter((value) => /qwik/i.test(value));
  let msg = "";
  if (qwikPkg.length > 0) {
    msg = `Move Qwik packages ${qwikPkg.join(", ")} to devDependencies`;
    throw new Error(msg);
  }
  if (duplicateDeps.length > 0) {
    msg = `Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies". Please move to "devDependencies" only.`;
    throw new Error(msg);
  }
}