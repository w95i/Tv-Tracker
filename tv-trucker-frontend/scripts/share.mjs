// `npm run share`: builds the site and serves it to everyone on your network (Wi-Fi / LAN), on port 3101.
// It builds into .nuxt-share, so it can run while `npm run dev` is up. It's a snapshot: run it again after changes.
import { spawnSync, spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const PORT = process.env.PORT || "3101";

const built = spawnSync("npx nuxt build", { stdio: "inherit", shell: true, env: { ...process.env, NUXT_BUILD_DIR: ".nuxt-share" } });
if (built.status !== 0) process.exit(built.status ?? 1);

// the addresses friends on the same network can open (skips loopback, link-local and virtual adapters)
const urls = Object.entries(networkInterfaces())
  .filter(([name]) => !/vEthernet|WSL|VirtualBox|VMware|Hyper-V|Loopback/i.test(name))
  .flatMap(([name, list]) => (list ?? []).filter((a) => a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.")).map((a) => `  http://${a.address}:${PORT}   (${name})`));

const server = spawn(process.execPath, [".output/server/index.mjs"], { stdio: "inherit", env: { ...process.env, HOST: "0.0.0.0", PORT } });
console.log(`\nShare one of these with people on your network:\n${urls.join("\n")}\n  http://localhost:${PORT}   (this computer)\n`);
server.on("exit", (code) => process.exit(code ?? 0));
