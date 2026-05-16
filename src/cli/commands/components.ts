import { componentRegistry, findComponentMeta } from "../../react/registry";

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
  console.log(
    "\nAuthoring rule: prefer MDX children for human-readable content; use props for stable ids, variants, layout controls, export values, and structured data."
  );
  console.log("\nUse `artifact-kit components <ComponentName>` to inspect props, authoring guidance, and examples.");
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

  if (component.authoring) {
    console.log(`\nAuthoring: ${component.authoring.kind}`);
    for (const item of component.authoring.guidance) {
      console.log(`- ${item}`);
    }
  }

  console.log("\nUse when:");
  for (const item of component.useWhen) {
    console.log(`- ${item}`);
  }

  console.log("\nProps:");
  for (const prop of component.props) {
    printProp(prop);
  }

  if (component.types?.length) {
    console.log("\nNested types:");
    for (const type of component.types) {
      console.log(`\n${type.name}${type.description ? `: ${type.description}` : ""}`);
      for (const field of type.fields) {
        printProp(field);
      }
    }
  }

  console.log("\nExample:");
  console.log(component.example);
}

function printProp(prop: { name: string; type: string; contentType?: string; required?: boolean; description: string }) {
  console.log(`- ${prop.name}${prop.required ? " (required)" : ""}: ${prop.type}`);
  if (prop.contentType) {
    console.log(`  content type: ${prop.contentType}`);
  }
  console.log(`  ${prop.description}`);
}
