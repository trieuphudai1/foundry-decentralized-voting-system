import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const react = require("@vitejs/plugin-react");
const root = process.cwd();

export default {
  root,
  plugins: [react()],
  build: {
    outDir: path.join(root, "dist"),
    rollupOptions: {
      input: path.join(root, "index.html")
    }
  },
  server: {
    watch: {
      usePolling: true,
      interval: 500,
      ignored: ["**/.env", "**/broadcast/**", "**/cache/**", "**/out/**", "**/lib/**"]
    }
  }
};
