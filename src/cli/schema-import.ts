import * as fs from "fs";
import * as path from "path";
import { getSupabaseClient } from "../platformConfig";
import { getCurrentContext } from "../auth";

interface BreakingChange {
  type: string;
  table?: string;
  column?: string;
  old_type?: string;
  new_type?: string;
  severity: string;
  message: string;
}

interface DatabaseSchema {
  id: string;
  name: string;
  version: number;
  parsed_schema: {
    tables: Record<string, any>;
    relationships: Array<any>;
  };
  breaking_changes: BreakingChange[] | null;
  uploaded_at: string;
}

export async function importSchema(options: {
  output?: string;
  schemaName?: string;
  update?: boolean;
}) {
  try {
    console.log("[Symulate] Importing database schema from platform...");

    // Get current context
    const { projectId, orgId } = getCurrentContext();

    if (!projectId) {
      console.error(
        "[Symulate] No project selected. Please select a project first."
      );
      console.log(
        "[Symulate] Run 'npx symulate projects list' to see available projects"
      );
      console.log(
        "[Symulate] Then run 'npx symulate projects use <project-id>' to select one"
      );
      process.exit(1);
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Fetch latest schema for this project
    let query = supabase
      .from("database_schemas")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("uploaded_at", { ascending: false });

    if (options.schemaName) {
      query = query.eq("name", options.schemaName);
    }

    const { data: schemas, error } = await query.limit(10);

    if (error) {
      throw error;
    }

    if (!schemas || schemas.length === 0) {
      console.log("[Symulate] No database schemas found for this project.");
      console.log(
        "[Symulate] Ask your backend team to upload a schema at https://platform.symulate.dev"
      );
      process.exit(1);
    }

    // If multiple schemas, let user choose or use the first one
    let selectedSchema: DatabaseSchema;

    if (schemas.length > 1 && !options.schemaName) {
      console.log("[Symulate] Multiple schemas found:");
      schemas.forEach((schema, index) => {
        console.log(
          `  [${index + 1}] ${schema.name} (v${schema.version}) - uploaded ${new Date(schema.uploaded_at).toLocaleDateString()}`
        );
      });
      console.log(
        "[Symulate] Using the most recent one. Specify --schema-name to choose a different one."
      );
      selectedSchema = schemas[0];
    } else {
      selectedSchema = schemas[0];
    }

    console.log(
      `[Symulate] Found schema: ${selectedSchema.name} (v${selectedSchema.version})`
    );

    // Check for breaking changes
    if (
      selectedSchema.breaking_changes &&
      selectedSchema.breaking_changes.length > 0
    ) {
      console.log("\n⚠️  Breaking changes detected in this version:");
      selectedSchema.breaking_changes.forEach((change) => {
        console.log(`   ${change.severity.toUpperCase()}: ${change.message}`);
      });
      console.log("");
    }

    // Generate TypeScript types
    const typescriptCode = generateTypeScriptTypes(
      selectedSchema.parsed_schema
    );

    // Determine output path (use .d.ts for declaration files that won't be executed)
    const outputPath = options.output
      ? path.resolve(process.cwd(), options.output)
      : path.resolve(process.cwd(), "./src/types/database.d.ts");

    // Check if file exists and we're updating
    if (fs.existsSync(outputPath)) {
      if (!options.update) {
        console.log(
          `[Symulate] File already exists: ${outputPath}`
        );
        console.log(
          "[Symulate] Use --update flag to overwrite, or specify a different --output path"
        );
        process.exit(1);
      }
      console.log(`[Symulate] Updating existing file: ${outputPath}`);
    } else {
      // Create directory if it doesn't exist
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      console.log(`[Symulate] Creating new file: ${outputPath}`);
    }

    // Write the file
    fs.writeFileSync(outputPath, typescriptCode, "utf-8");

    console.log(`✓ Database types imported successfully!`);
    console.log(`\n📝 Generated file: ${outputPath}`);
    console.log(`\n💡 Usage example:`);
    console.log(`\n  import { m } from '@symulate/sdk'`);
    console.log(`  import type { User } from './types/database'`);
    console.log(`  import type {} from './types/database' // Type-only import for autocomplete`);
    console.log(`\n  const getUser = defineEndpoint<User>({`);
    console.log(`    path: '/api/users/:id',`);
    console.log(`    schema: m.object({`);
    console.log(`      id: m.db('users.id'), // Autocomplete works automatically!`);
    console.log(`      name: m.db('users.name', 'German name'), // with AI instruction`);
    console.log(`      email: m.db('users.email')`);
    console.log(`    })`);
    console.log(`  })\n`);

    // Show next steps if breaking changes
    if (
      selectedSchema.breaking_changes &&
      selectedSchema.breaking_changes.length > 0
    ) {
      console.log(
        "⚠️  Don't forget to update your endpoint definitions to fix breaking changes!"
      );
    }
  } catch (error) {
    console.error("[Symulate] Error importing schema:", error);
    process.exit(1);
  }
}

function generateTypeScriptTypes(parsedSchema: {
  tables: Record<string, any>;
  relationships: Array<any>;
}): string {
  let output = "/**\n";
  output += " * Database Types\n";
  output += " *\n";
  output += " * Auto-generated by Symulate - DO NOT EDIT MANUALLY\n";
  output += ` * Generated: ${new Date().toISOString()}\n`;
  output += " *\n";
  output +=
    " * To update: run 'npx symulate import-schema --update'\n";
  output += " */\n\n";

  // Generate DatabaseTypes constant
  output += "export const DatabaseTypes = {\n";

  for (const [tableName, table] of Object.entries(parsedSchema.tables)) {
    // Quote table names to handle special characters like dots
    output += `  "${tableName}": {\n`;

    for (const [columnName, column] of Object.entries(
      table.columns as Record<string, any>
    )) {
      const comments: string[] = [];

      if (column.isPrimaryKey) comments.push("PK");
      if (column.isForeignKey && column.references) {
        comments.push(
          `FK → ${column.references.table}.${column.references.column}`
        );
      }
      if (!column.nullable) comments.push("NOT NULL");

      const commentStr = comments.length > 0 ? ` // ${comments.join(", ")}` : "";

      // Quote column names to handle special characters
      output += `    "${columnName}": "${column.type}",${commentStr}\n`;
    }

    output += "  },\n";
  }

  output += "} as const;\n\n";

  // Generate database path type for autocomplete
  output += "// Database path type for m.db() autocomplete\n";
  output += "export type DatabasePath =\n";

  const paths: string[] = [];
  for (const [tableName, table] of Object.entries(parsedSchema.tables)) {
    for (const columnName of Object.keys(table.columns as Record<string, any>)) {
      paths.push(`  | "${tableName}.${columnName}"`);
    }
  }

  if (paths.length > 0) {
    output += paths.join("\n");
    output += ";\n\n";
  } else {
    output += "  never;\n\n";
  }

  // Generate module augmentation for automatic autocomplete
  output += "// Module augmentation to enable automatic autocomplete for m.db()\n";
  output += "// Import this file to enable autocomplete: import './types/database'\n";
  output += "import type { SchemaBuilder as BaseSchemaBuilder } from '@symulate/sdk';\n\n";
  output += "declare module '@symulate/sdk' {\n";
  output += "  interface SchemaBuilder {\n";
  output += "    db<T extends ";

  // Inline a limited set of paths (first 100) for autocomplete
  const limitedPaths = paths.slice(0, Math.min(100, paths.length));
  if (limitedPaths.length > 0) {
    output += limitedPaths.map(p => p.trim().replace(/^\| /, '')).join(" | ");
  } else {
    output += "string";
  }

  output += ">(tableDotColumn: T, description?: string): ReturnType<BaseSchemaBuilder['db']>;\n";
  output += "  }\n";
  output += "}\n\n";

  // Generate TypeScript interfaces
  output += "// TypeScript Interfaces\n\n";

  for (const [tableName, table] of Object.entries(parsedSchema.tables)) {
    const interfaceName = toPascalCase(tableName);

    output += `export interface ${interfaceName} {\n`;

    for (const [columnName, column] of Object.entries(
      table.columns as Record<string, any>
    )) {
      const tsType = mapSQLTypeToTS(column.type);
      const optional = column.nullable ? "?" : "";
      const nullableType =
        column.nullable && !optional ? " | null" : "";

      // Add JSDoc comments for foreign keys
      if (column.isForeignKey && column.references) {
        output += `  /** Foreign key to ${column.references.table}.${column.references.column} */\n`;
      }

      // Quote column names if they contain special characters
      const needsQuotes = /[^a-zA-Z0-9_$]/.test(columnName);
      const quotedColumnName = needsQuotes ? `"${columnName}"` : columnName;

      output += `  ${quotedColumnName}${optional}: ${tsType}${nullableType};\n`;
    }

    output += "}\n\n";
  }

  // Add relationship information as comments
  if (parsedSchema.relationships && parsedSchema.relationships.length > 0) {
    output += "// Relationships\n";
    output += "/*\n";
    for (const rel of parsedSchema.relationships) {
      output += ` * ${rel.fromTable}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}\n`;
    }
    output += " */\n";
  }

  return output;
}

function toPascalCase(str: string): string {
  // Replace dots and other special characters with underscores, then convert to PascalCase
  return str
    .replace(/[^a-zA-Z0-9_]/g, "_") // Replace non-alphanumeric (except underscore) with underscore
    .split("_")
    .filter((word) => word.length > 0) // Remove empty strings
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function mapSQLTypeToTS(sqlType: string): string {
  const type = sqlType.toLowerCase().split("(")[0];

  const typeMap: Record<string, string> = {
    // String types
    varchar: "string",
    char: "string",
    text: "string",
    uuid: "string",

    // Number types
    integer: "number",
    int: "number",
    smallint: "number",
    bigint: "number",
    decimal: "number",
    numeric: "number",
    real: "number",
    "double precision": "number",
    serial: "number",
    bigserial: "number",

    // Boolean
    boolean: "boolean",
    bool: "boolean",

    // Date/Time
    timestamp: "string",
    timestamptz: "string",
    "timestamp with time zone": "string",
    date: "string",
    time: "string",
    timetz: "string",

    // JSON
    json: "any",
    jsonb: "any",

    // Array
    array: "any[]",
  };

  return typeMap[type] || "any";
}
