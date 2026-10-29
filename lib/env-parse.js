// Reads the text of a .env file into rows for display. Comments and blank lines are kept so the file can be shown as written.

/** @returns {{ type: "var", key: string, value: string } | { type: "comment" | "blank", text: string }} per line */
export function parseEnv(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return { type: "blank", text: "" };
      if (trimmed.startsWith("#")) return { type: "comment", text: trimmed };
      const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(trimmed);
      if (!match) return { type: "comment", text: trimmed };
      let value = match[2];
      const quote = value[0];
      if ((quote === '"' || quote === "'") && value.length > 1 && value.endsWith(quote)) value = value.slice(1, -1);
      return { type: "var", key: match[1], value };
    });
}

export const countVariables = (text) => parseEnv(text).filter((row) => row.type === "var").length;
