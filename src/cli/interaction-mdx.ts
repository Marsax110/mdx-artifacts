import type { SortableListItem } from "../react";

export type SortableListSeed = {
  id: string;
  title: string;
  summary?: string;
  items: SortableListItem[];
};

export function extractSortableListSeeds(source: string): SortableListSeed[] {
  return findJsxOpeningTags(source, "SortableList").map((tagSource) => parseSortableListTag(tagSource));
}

function parseSortableListTag(tagSource: string): SortableListSeed {
  const id = extractStringProp(tagSource, "id");
  const title = extractStringProp(tagSource, "title");
  const summary = extractStringProp(tagSource, "summary");
  const itemsExpression = extractExpressionProp(tagSource, "items");

  if (!id) {
    throw new Error("SortableList is missing required id prop.");
  }

  if (!title) {
    throw new Error(`SortableList ${id} is missing required title prop.`);
  }

  if (!itemsExpression) {
    throw new Error(`SortableList ${id} is missing required items prop.`);
  }

  return {
    id,
    title,
    ...(summary ? { summary } : {}),
    items: parseSortableListItems(itemsExpression, id)
  };
}

function parseSortableListItems(expression: string, listId: string): SortableListItem[] {
  const parser = new StaticExpressionParser(expression);
  const value = parser.parse();

  if (!Array.isArray(value)) {
    throw new Error(`SortableList ${listId} items must be a static object array.`);
  }

  return value.map((item, index) => normalizeSortableListItem(item, listId, index));
}

function normalizeSortableListItem(value: unknown, listId: string, index: number): SortableListItem {
  if (!isRecord(value)) {
    throw new Error(`SortableList ${listId} item at index ${index} must be an object.`);
  }

  if (typeof value.id !== "string" || !value.id) {
    throw new Error(`SortableList ${listId} item at index ${index} is missing string id.`);
  }

  if (typeof value.title !== "string" || !value.title) {
    throw new Error(`SortableList ${listId} item ${value.id} is missing string title.`);
  }

  return {
    id: value.id,
    title: value.title,
    ...(typeof value.summary === "string" ? { summary: value.summary } : {}),
    ...(typeof value.badge === "string" ? { badge: value.badge } : {}),
    ...(Array.isArray(value.tags) ? { tags: value.tags.filter((tag): tag is string => typeof tag === "string") } : {}),
    ...(typeof value.disabled === "boolean" ? { disabled: value.disabled } : {})
  };
}

function findJsxOpeningTags(source: string, componentName: string) {
  const tags: string[] = [];
  const startPattern = new RegExp(`<${componentName}(?=[\\s>/])`, "g");

  for (const match of source.matchAll(startPattern)) {
    const start = match.index ?? 0;
    const end = findJsxOpeningTagEnd(source, start);
    if (end >= 0) {
      tags.push(source.slice(start, end + 1));
    }
  }

  return tags;
}

function findJsxOpeningTagEnd(source: string, start: number) {
  const scanner = new SourceScanner(source, start);
  let braceDepth = 0;

  while (!scanner.done()) {
    const char = scanner.current();
    if (scanner.consumeString()) {
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
    } else if (char === "}") {
      braceDepth -= 1;
    } else if (char === ">" && braceDepth === 0) {
      return scanner.index;
    }

    scanner.advance();
  }

  return -1;
}

function extractStringProp(source: string, propName: string) {
  const direct = source.match(new RegExp(`\\b${propName}\\s*=\\s*["']([^"']*)["']`))?.[1];
  if (direct !== undefined) {
    return direct;
  }

  return source.match(new RegExp(`\\b${propName}\\s*=\\s*\\{\\s*["']([^"']*)["']\\s*\\}`))?.[1];
}

function extractExpressionProp(source: string, propName: string) {
  const propStart = source.search(new RegExp(`\\b${propName}\\s*=\\s*\\{`));
  if (propStart < 0) {
    return undefined;
  }

  const expressionStart = source.indexOf("{", propStart);
  const expressionEnd = findMatchingBrace(source, expressionStart);
  if (expressionEnd < 0) {
    return undefined;
  }

  return source.slice(expressionStart + 1, expressionEnd);
}

function findMatchingBrace(source: string, start: number) {
  const scanner = new SourceScanner(source, start);
  let depth = 0;

  while (!scanner.done()) {
    const char = scanner.current();
    if (scanner.consumeString()) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return scanner.index;
      }
    }

    scanner.advance();
  }

  return -1;
}

class StaticExpressionParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): unknown {
    const value = this.parseValue();
    this.skipWhitespace();

    if (!this.done()) {
      throw new Error("SortableList items must use a static object array.");
    }

    return value;
  }

  private parseValue(): unknown {
    this.skipWhitespace();
    const char = this.current();

    if (char === "[" || char === "{") {
      return char === "[" ? this.parseArray() : this.parseObject();
    }

    if (char === '"' || char === "'" || char === "`") {
      return this.parseString();
    }

    if (this.source.startsWith("true", this.index)) {
      this.index += 4;
      return true;
    }

    if (this.source.startsWith("false", this.index)) {
      this.index += 5;
      return false;
    }

    if (this.source.startsWith("null", this.index)) {
      this.index += 4;
      return null;
    }

    throw new Error("SortableList items must use only static objects, arrays, strings, booleans, or null.");
  }

  private parseArray() {
    const values: unknown[] = [];
    this.expect("[");
    this.skipWhitespace();

    while (this.current() !== "]") {
      values.push(this.parseValue());
      this.skipWhitespace();
      if (this.current() === ",") {
        this.index += 1;
        this.skipWhitespace();
      } else if (this.current() !== "]") {
        throw new Error("SortableList items array contains unsupported syntax.");
      }
    }

    this.expect("]");
    return values;
  }

  private parseObject() {
    const value: Record<string, unknown> = {};
    this.expect("{");
    this.skipWhitespace();

    while (this.current() !== "}") {
      const key = this.parseObjectKey();
      this.skipWhitespace();
      this.expect(":");
      value[key] = this.parseValue();
      this.skipWhitespace();

      if (this.current() === ",") {
        this.index += 1;
        this.skipWhitespace();
      } else if (this.current() !== "}") {
        throw new Error("SortableList item object contains unsupported syntax.");
      }
    }

    this.expect("}");
    return value;
  }

  private parseObjectKey() {
    this.skipWhitespace();
    const char = this.current();

    if (char === '"' || char === "'") {
      return this.parseString();
    }

    const match = this.source.slice(this.index).match(/^[A-Za-z_$][A-Za-z0-9_$-]*/);
    if (!match) {
      throw new Error("SortableList item object contains an unsupported key.");
    }

    this.index += match[0].length;
    return match[0];
  }

  private parseString() {
    const quote = this.current();
    let value = "";
    this.index += 1;

    while (!this.done()) {
      const char = this.current();
      if (char === quote) {
        this.index += 1;
        return value;
      }

      if (quote === "`" && char === "$" && this.source[this.index + 1] === "{") {
        throw new Error("SortableList items do not support template interpolation.");
      }

      if (char === "\\") {
        value += this.parseEscape();
      } else {
        value += char;
        this.index += 1;
      }
    }

    throw new Error("SortableList items contain an unterminated string.");
  }

  private parseEscape() {
    const next = this.source[this.index + 1];
    if (next === undefined) {
      throw new Error("SortableList items contain an invalid string escape.");
    }

    this.index += 2;
    if (next === "n") return "\n";
    if (next === "r") return "\r";
    if (next === "t") return "\t";
    return next;
  }

  private expect(char: string) {
    if (this.current() !== char) {
      throw new Error(`Expected ${char} in SortableList items.`);
    }

    this.index += 1;
  }

  private skipWhitespace() {
    while (!this.done() && /\s/.test(this.current())) {
      this.index += 1;
    }
  }

  private current() {
    return this.source[this.index] ?? "";
  }

  private done() {
    return this.index >= this.source.length;
  }
}

class SourceScanner {
  constructor(
    private readonly source: string,
    public index: number
  ) {}

  consumeString() {
    const quote = this.current();
    if (quote !== '"' && quote !== "'" && quote !== "`") {
      return false;
    }

    this.index += 1;
    while (!this.done()) {
      const char = this.current();
      if (char === "\\") {
        this.index += 2;
        continue;
      }
      if (quote === "`" && char === "$" && this.source[this.index + 1] === "{") {
        this.index += 2;
        continue;
      }
      this.index += 1;
      if (char === quote) {
        break;
      }
    }

    return true;
  }

  current() {
    return this.source[this.index] ?? "";
  }

  advance() {
    this.index += 1;
  }

  done() {
    return this.index >= this.source.length;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
