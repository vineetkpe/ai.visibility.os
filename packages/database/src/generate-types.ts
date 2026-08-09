import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pgTypeToTs(udtName: string, dataType: string, enumsMap: Map<string, string[]>): string {
  // Check if it's an array type (starts with _)
  if (udtName.startsWith('_')) {
    const elementUdt = udtName.substring(1);
    const elementTs = pgTypeToTs(elementUdt, elementUdt, enumsMap);
    return `${elementTs}[]`;
  }

  if (enumsMap.has(udtName)) {
    return `Database["public"]["Enums"]["${udtName}"]`;
  }

  switch (udtName) {
    case 'uuid':
    case 'varchar':
    case 'text':
    case 'bpchar':
    case 'timestamptz':
    case 'timestamp':
    case 'date':
    case 'time':
    case 'inet':
    case 'name':
      return 'string';
    case 'int2':
    case 'int4':
    case 'int8':
    case 'numeric':
    case 'decimal':
    case 'float4':
    case 'float8':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'json':
    case 'jsonb':
      return 'Json';
    default:
      if (dataType === 'ARRAY') {
        return 'string[]';
      }
      return 'string';
  }
}

async function generate() {
  const db = new PGlite();

  // Stub auth schema and roles for Supabase environment simulation
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      raw_user_meta_data JSONB
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid $$ LANGUAGE sql;
    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$ SELECT '{}'::jsonb $$ LANGUAGE sql;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
      END IF;
    END $$;
  `);

  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    sql = sql.replace(/CREATE EXTENSION[^\n;]+;/gi, '-- CREATE EXTENSION skipped');
    sql = sql.replace(/ALTER EXTENSION[^\n;]+;/gi, '-- ALTER EXTENSION skipped');
    await db.exec(sql);
  }

  // 1. Fetch Enums
  const enumsRes = await db.query<{ enum_name: string; enum_values: string[] }>(`
    SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;
  `);

  const enumsMap = new Map<string, string[]>();
  for (const row of enumsRes.rows) {
    enumsMap.set(row.enum_name, row.enum_values);
  }

  // 2. Fetch Tables and Columns
  const columnsRes = await db.query<{
    table_name: string;
    column_name: string;
    udt_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>(`
    SELECT 
      c.table_name,
      c.column_name,
      c.udt_name,
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
  `);

  const tablesMap = new Map<string, typeof columnsRes.rows>();
  for (const col of columnsRes.rows) {
    if (!tablesMap.has(col.table_name)) {
      tablesMap.set(col.table_name, []);
    }
    tablesMap.get(col.table_name)!.push(col);
  }

  // 3. Fetch Foreign Key Relationships
  const fkRes = await db.query<{
    table_name: string;
    column_name: string;
    foreign_key_name: string;
    referenced_table_name: string;
    referenced_column_name: string;
  }>(`
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name as foreign_key_name,
      ccu.table_name AS referenced_table_name,
      ccu.column_name AS referenced_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);

  const fkMap = new Map<string, typeof fkRes.rows>();
  for (const fk of fkRes.rows) {
    if (!fkMap.has(fk.table_name)) {
      fkMap.set(fk.table_name, []);
    }
    fkMap.get(fk.table_name)!.push(fk);
  }

  // 4. Fetch Functions
  const funcsRes = await db.query<{
    function_name: string;
    args: string;
    returns: string;
  }>(`
    SELECT 
      p.proname as function_name,
      pg_get_function_arguments(p.oid) as args,
      pg_get_function_result(p.oid) as returns
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
    ORDER BY p.proname;
  `);

  let code = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {\n`;

  for (const [tableName, cols] of tablesMap.entries()) {
    code += `      ${tableName}: {\n`;
    
    // Row
    code += `        Row: {\n`;
    for (const col of cols) {
      const tsType = pgTypeToTs(col.udt_name, col.data_type, enumsMap);
      const isNullable = col.is_nullable === 'YES';
      code += `          ${col.column_name}: ${tsType}${isNullable ? ' | null' : ''}\n`;
    }
    code += `        }\n`;

    // Insert
    code += `        Insert: {\n`;
    for (const col of cols) {
      const tsType = pgTypeToTs(col.udt_name, col.data_type, enumsMap);
      const isNullable = col.is_nullable === 'YES';
      const hasDefault = col.column_default !== null;
      const isOptional = isNullable || hasDefault;
      code += `          ${col.column_name}${isOptional ? '?' : ''}: ${tsType}${isNullable ? ' | null' : ''}\n`;
    }
    code += `        }\n`;

    // Update
    code += `        Update: {\n`;
    for (const col of cols) {
      const tsType = pgTypeToTs(col.udt_name, col.data_type, enumsMap);
      const isNullable = col.is_nullable === 'YES';
      code += `          ${col.column_name}?: ${tsType}${isNullable ? ' | null' : ''}\n`;
    }
    code += `        }\n`;

    // Relationships
    const fks = fkMap.get(tableName) || [];
    code += `        Relationships: [\n`;
    for (const fk of fks) {
      code += `          {\n`;
      code += `            foreignKeyName: "${fk.foreign_key_name}"\n`;
      code += `            columns: ["${fk.column_name}"]\n`;
      code += `            isOneToOne: false\n`;
      code += `            referencedRelation: "${fk.referenced_table_name}"\n`;
      code += `            referencedColumns: ["${fk.referenced_column_name}"]\n`;
      code += `          },\n`;
    }
    code += `        ]\n`;

    code += `      }\n`;
  }

  code += `    }\n`;
  code += `    Views: {\n      [_ in never]: never\n    }\n`;

  // Functions
  code += `    Functions: {\n`;
  for (const fn of funcsRes.rows) {
    // Filter out trigger functions returning trigger or event_trigger
    if (fn.returns === 'trigger' || fn.returns === 'event_trigger') continue;

    code += `      ${fn.function_name}: {\n`;
    code += `        Args: {\n`;

    if (fn.args.trim()) {
      const argParts = fn.args.split(',').map(a => a.trim());
      for (const arg of argParts) {
        const spaceIdx = arg.indexOf(' ');
        if (spaceIdx > 0) {
          const argName = arg.substring(0, spaceIdx);
          const argType = arg.substring(spaceIdx + 1);
          let tsType = 'string';
          if (argType.includes('int') || argType.includes('numeric')) tsType = 'number';
          if (argType.includes('bool')) tsType = 'boolean';
          code += `          ${argName}: ${tsType}\n`;
        }
      }
    }
    code += `        }\n`;

    let returnTsType = 'unknown';
    if (fn.returns.includes('uuid') || fn.returns.includes('text') || fn.returns.includes('varchar')) {
      returnTsType = 'string';
    } else if (fn.returns.includes('int') || fn.returns.includes('numeric')) {
      returnTsType = 'number';
    } else if (fn.returns.includes('bool')) {
      returnTsType = 'boolean';
    } else if (fn.returns === 'void') {
      returnTsType = 'void';
    }

    code += `        Returns: ${returnTsType}\n`;
    code += `      }\n`;
  }
  code += `    }\n`;

  // Enums
  code += `    Enums: {\n`;
  for (const [enumName, enumValues] of enumsMap.entries()) {
    const valString = enumValues.map(v => `"${v}"`).join(' | ');
    code += `      ${enumName}: ${valString}\n`;
  }
  code += `    }\n`;
  code += `    CompositeTypes: {\n      [_ in never]: never\n    }\n`;
  code += `  }\n}\n`;

  const outputPath = path.resolve(__dirname, 'types.ts');
  fs.writeFileSync(outputPath, code, 'utf-8');
  console.log(`Generated types saved to ${outputPath}`);
}

generate().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
