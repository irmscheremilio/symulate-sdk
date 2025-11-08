/**
 * CLI commands for managing stateful collections
 */

import { createClient } from '@supabase/supabase-js';

interface CollectionData {
  id: string;
  project_id: string;
  collection_name: string;
  branch: string;
  created_at: string;
  updated_at: string;
  data: any[];
}

/**
 * Get Supabase client with session authentication
 */
function getSupabaseClient(accessToken: string) {
  const { PLATFORM_CONFIG } = require('../platformConfig');

  const supabase = createClient(
    PLATFORM_CONFIG.supabase.url,
    PLATFORM_CONFIG.supabase.anonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  return supabase;
}

/**
 * List all collections for a project
 */
export async function listCollections(options: {
  accessToken: string;
  projectId: string;
  branch?: string;
}): Promise<void> {
  const { accessToken, projectId, branch } = options;

  console.log(`\n📦 Listing collections for project: ${projectId}`);
  if (branch) {
    console.log(`   Branch: ${branch}`);
  }

  const supabase = getSupabaseClient(accessToken);

  let query = supabase
    .from('collection_data')
    .select('*')
    .eq('project_id', projectId);

  if (branch) {
    query = query.eq('branch', branch);
  }

  const { data, error } = await query.order('collection_name').order('branch');

  if (error) {
    console.error('❌ Error fetching collections:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('\n   No collections found.');
    return;
  }

  // Group by collection name
  const grouped = data.reduce((acc: Record<string, CollectionData[]>, item) => {
    if (!acc[item.collection_name]) {
      acc[item.collection_name] = [];
    }
    acc[item.collection_name].push(item);
    return acc;
  }, {});

  console.log(`\n   Found ${Object.keys(grouped).length} collection(s):\n`);

  Object.entries(grouped).forEach(([name, branches]) => {
    console.log(`   • ${name}`);
    branches.forEach((branchData) => {
      const itemCount = Array.isArray(branchData.data) ? branchData.data.length : 0;
      console.log(`     └─ ${branchData.branch} (${itemCount} items)`);
    });
  });

  console.log('');
}

/**
 * Delete collection(s)
 */
export async function deleteCollections(options: {
  accessToken: string;
  projectId: string;
  name?: string;
  branch?: string;
  all?: boolean;
}): Promise<void> {
  const { accessToken, projectId, name, branch, all } = options;

  const supabase = getSupabaseClient(accessToken);

  if (all) {
    // Delete all collections for project
    if (!branch) {
      console.log('\n⚠️  WARNING: You are about to delete ALL collections across ALL branches for this project.');
      console.log('   This action cannot be undone.');

      // In a real implementation, you'd use a prompt library like inquirer
      // For now, we'll just proceed with a warning
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      await new Promise<void>((resolve) => {
        rl.question('\n   Type "DELETE ALL" to confirm: ', async (answer: string) => {
          rl.close();
          if (answer.trim() !== 'DELETE ALL') {
            console.log('\n   ❌ Deletion cancelled.');
            process.exit(0);
          }
          resolve();
        });
      });
    }

    console.log('\n🗑️  Deleting collections...');

    let query = supabase
      .from('collection_data')
      .delete()
      .eq('project_id', projectId);

    if (branch) {
      query = query.eq('branch', branch);
      console.log(`   Branch: ${branch}`);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ Error deleting collections:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log(`\n   ⚠️  No collections found to delete${branch ? ` on branch "${branch}"` : ''}.`);
      return;
    }

    const deletedCount = data.length;
    console.log(`\n   ✅ Deleted ${deletedCount} collection(s)${branch ? ` from branch "${branch}"` : ''}.`);
  } else if (name) {
    // Delete specific collection
    console.log(`\n🗑️  Deleting collection "${name}"...`);
    if (branch) {
      console.log(`   Branch: ${branch}`);
    }

    let query = supabase
      .from('collection_data')
      .delete()
      .eq('project_id', projectId)
      .eq('collection_name', name);

    if (branch) {
      query = query.eq('branch', branch);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ Error deleting collection:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error(`\n   ❌ Collection "${name}" not found${branch ? ` on branch "${branch}"` : ''}.`);
      console.log('\n   Run "npx symulate collections list" to see available collections.');
      process.exit(1);
    }

    const deletedCount = data.length;
    console.log(`\n   ✅ Deleted ${deletedCount} record(s) for collection "${name}"${branch ? ` from branch "${branch}"` : ''}.`);
  } else {
    console.error('❌ Please specify --name <collection> or --all');
    process.exit(1);
  }

  console.log('');
}

/**
 * Pre-generate collections
 */
export async function pregenerateCollections(options: {
  accessToken: string;
  projectId: string;
  branch?: string;
}): Promise<void> {
  const { accessToken, projectId, branch = 'main' } = options;

  // First, get the project's API keys
  const { getConfig } = await import('../config');
  const config = getConfig();
  const apiKey = config.symulateApiKey;

  if (!apiKey) {
    console.error('\n❌ No API key configured.');
    console.error('   Add your API key to symulate.config.js or .env:');
    console.error('   SYMULATE_API_KEY=sym_live_xxx');
    console.error('\n   Get your API key from https://platform.symulate.dev');
    process.exit(1);
  }

  console.log(`\n🔄 Pre-generating collections...`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Branch: ${branch}`);

  // Load collections from code
  console.log('\n   Loading collection definitions from code...');

  const { loadEndpoints } = await import('../loadEndpoints');
  await loadEndpoints();

  const { exportCollectionsArray } = await import('../collectionRegistry');
  const collections = exportCollectionsArray();

  if (collections.length === 0) {
    console.log('\n   ⚠️  No collections found in your code.');
    console.log('   Make sure you have defined collections using defineCollection()');
    process.exit(1);
  }

  console.log(`\n   Found ${collections.length} collection(s) to generate:\n`);
  collections.forEach((col) => {
    console.log(`     • ${col.name}`);
  });

  console.log('\n   Generating data via edge function...\n');

  const { PLATFORM_CONFIG } = require('../platformConfig');
  const { schemaToTypeDescription } = await import('../schema');

  for (const collection of collections) {
    try {
      console.log(`     Generating "${collection.name}"...`);

      const entitySchema = schemaToTypeDescription(collection.schema);

      // Call edge function to generate collection data
      const response = await fetch(`${PLATFORM_CONFIG.supabase.url}/functions/v1/symulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mockend-api-key': apiKey,
          'x-mockend-project-id': projectId,
          'x-symulate-stateful-operation': 'list'
        },
        body: JSON.stringify({
          collectionName: collection.name,
          operation: 'list',
          entitySchema,
          instruction: collection.config.seedInstruction,
          branch,
          page: 1,
          limit: collection.config.seedCount || 20
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: any = await response.json();
      const itemCount = result.data?.length || result.pagination?.total || 0;

      console.log(`       ✅ Generated ${itemCount} items`);
    } catch (error: any) {
      console.error(`       ❌ Error: ${error.message}`);
    }
  }

  console.log('\n   ✅ Pre-generation complete!\n');
}
