import { componentRegistry, findComponentMeta } from "../react/registry";

export function componentsCommand(input?: string, options: { json?: boolean } = {}) {
  if (input) {
    const component = findComponentMeta(input);
    if (!component) {
      throw new Error(`Unknown component: ${input}`);
    }

    if (options.json) {
      console.log(JSON.stringify(component, null, 2));
      return;
    }

    printComponent(component);
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(componentRegistry, null, 2));
    return;
  }

  console.log("Available artifact components:\n");
  for (const component of componentRegistry) {
    console.log(`- ${component.name}: ${component.description}`);
  }
  console.log("\nUse `artifact-kit components <ComponentName>` to inspect props and examples.");
  console.log("Use `artifact-kit components --json` for machine-readable metadata.");
}

function printComponent(component: (typeof componentRegistry)[number]) {
  console.log(`${component.name}\n`);
  console.log(component.description);
  if (component.category || component.stability) {
    console.log(
      `\nMetadata: ${[component.category ? `category=${component.category}` : undefined, component.stability ? `stability=${component.stability}` : undefined].filter(Boolean).join(", ")}`
    );
  }
  console.log("\nUse when:");
  for (const item of component.useWhen) {
    console.log(`- ${item}`);
  }

  console.log("\nProps:");
  for (const prop of component.props) {
    console.log(`- ${prop.name}${prop.required ? " (required)" : ""}: ${prop.type}`);
    if (prop.contentType) {
      console.log(`  content type: ${prop.contentType}`);
    }
    console.log(`  ${prop.description}`);
  }

  console.log("\nExample:");
  console.log(component.example);
}
