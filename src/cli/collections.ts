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

  // Get current organization from context
  const { getCurrentContext } = await import('../auth');
  const { orgId } = getCurrentContext();

  if (!orgId) {
    console.error('\n❌ No organization selected.');
    console.error('   Run "npx symulate organizations list" and "npx symulate organizations use <org-id>" to select an organization.');
    process.exit(1);
  }

  console.log(`\n🔄 Pre-generating collections...`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Branch: ${branch}`);

  // Fetch collection schemas from platform (only for selected project)
  console.log('\n   Fetching collection schemas from platform...');

  const supabase = getSupabaseClient(accessToken);

  const { data: schemas, error: schemasError } = await supabase
    .from('collection_schemas')
    .select('*')
    .eq('project_id', projectId);

  if (schemasError) {
    console.error('\n❌ Failed to fetch collection schemas:', schemasError.message);
    process.exit(1);
  }

  if (!schemas || schemas.length === 0) {
    console.log('\n   ⚠️  No collection schemas found for this project.');
    console.log('   Run "npx symulate sync" to sync your collection definitions first.');
    process.exit(1);
  }

  console.log(`\n   Found ${schemas.length} collection(s) to generate:\n`);
  schemas.forEach((schema) => {
    console.log(`     • ${schema.name}`);
  });

  // Get user info for job creation
  const { data: { user } } = await supabase.auth.getUser(accessToken);

  if (!user) {
    console.error('\n❌ Failed to get user info');
    process.exit(1);
  }

  // Create generation job
  console.log('\n   Creating generation job...');

  const { data: job, error: jobError } = await supabase
    .from('collection_generation_jobs')
    .insert({
      organization_id: orgId,
      project_id: projectId,
      created_by_user_id: user.id,
      collection_names: schemas.map((s: any) => s.name),
      branch,
      custom_instruction: null, // Always null for development workflow
      notify_emails: [user.email] // Notify job creator
    })
    .select()
    .single();

  if (jobError || !job) {
    console.error('\n❌ Failed to create job:', jobError?.message);
    process.exit(1);
  }

  console.log(`   Job created: ${job.id}`);
  console.log('\n   Starting generation...\n');

  const { PLATFORM_CONFIG } = require('../platformConfig');

  // Trigger job processing (fire and forget)
  fetch(`${PLATFORM_CONFIG.supabase.url}/functions/v1/process-generation-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ jobId: job.id })
  }).catch(() => {
    // Ignore errors - job will be picked up later if this fails
  });

  // Poll for progress
  let lastProgress = 0;
  const pollInterval = setInterval(async () => {
    const { data: updatedJob } = await supabase
      .from('collection_generation_jobs')
      .select('*')
      .eq('id', job.id)
      .single();

    if (!updatedJob) return;

    const progress = updatedJob.progress as any;

    // Show progress updates
    if (progress.current > lastProgress) {
      const completed = progress.completed as string[];
      const failed = progress.failed as any[];

      // Show newly completed
      for (let i = lastProgress; i < progress.current; i++) {
        if (i < completed.length) {
          console.log(`     ✅ ${completed[i]}`);
        }
      }

      // Show failed
      failed.forEach((f: any) => {
        console.log(`     ❌ ${f.name}: ${f.error}`);
      });

      lastProgress = progress.current;
    }

    // Check if complete
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      clearInterval(pollInterval);

      console.log('\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (updatedJob.status === 'completed') {
        console.log(`   ✅ Generation complete!`);
        console.log(`   Generated ${progress.completed.length} collection(s)`);
      } else {
        console.log(`   ⚠️  Generation completed with errors`);
        console.log(`   Successful: ${progress.completed.length}`);
        console.log(`   Failed: ${progress.failed.length}`);
      }

      if (updatedJob.notify_emails && updatedJob.notify_emails.length > 0) {
        console.log(`\n   📧 Email notification sent to: ${updatedJob.notify_emails.join(', ')}`);
      }

      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }, 2000); // Poll every 2 seconds

  // Wait up to 5 minutes, then exit (job continues in background)
  setTimeout(() => {
    clearInterval(pollInterval);
    console.log('\n   ⏱️  Job is taking longer than expected...');
    console.log(`   Job continues in background. Check status at:`);
    console.log(`   https://platform.symulate.dev/dashboard/collections\n`);
    process.exit(0);
  }, 300000); // 5 minutes
}
