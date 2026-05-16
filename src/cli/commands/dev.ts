import path from "node:path";
import { loadConfig } from "../config/config";
import { createArtifactProject, startDevServer } from "../dev-server/vite-artifact";

export async function devCommand(projectRoot: string, input: string) {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  const project = await createArtifactProject(projectRoot, mdxPath, config);
  const server = await startDevServer(project);

  const urls = server.resolvedUrls?.local ?? [];
  console.log(`dev server ready: ${artifactUrl(urls[0] ?? `http://localhost:${config.port}/`, project.artifact.routePath)}`);
  console.log("press Ctrl+C to stop");

  const close = async () => {
    await server.close();
    await project.cleanup();
    process.exit(0);
  };

  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

function artifactUrl(baseUrl: string, routePath: string) {
  const url = new URL(baseUrl);
  url.pathname = routePath;
  return url.toString();
}
