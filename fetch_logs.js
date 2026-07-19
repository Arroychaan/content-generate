import { supabaseAdmin } from './src/lib/supabase.js';

async function fetchLogs() {
  const { data, error } = await supabaseAdmin
    .from('system_activity_logs')
    .select('message, metadata, id')
    .eq('event_type', 'AGENT_ERROR')
    .eq('agent_stage', 10)
    .order('id', { ascending: false })
    .limit(3);

  if (error) {
    console.error(error);
  } else {
    data.forEach(log => {
      console.log(`[${log.id}] ${log.message}`);
      console.log(`Error: ${JSON.stringify(log.metadata)}`);
    });
  }
}
fetchLogs();
