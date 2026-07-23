import { supabaseAdmin } from '../../lib/supabase';

/**
 * Get current system status ('RUNNING' or 'STOPPED')
 */
export async function getSystemStatus() {
  try {
    if (!supabaseAdmin) return 'RUNNING';

    // 1. Try fetching from system_settings table
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'SYSTEM_STATUS')
      .maybeSingle();

    if (!settingsError && settingsData && settingsData.value) {
      return settingsData.value;
    }

    // 2. Fallback: check latest control event in system_activity_logs
    const { data: logsData } = await supabaseAdmin
      .from('system_activity_logs')
      .select('event_type')
      .in('event_type', ['SYSTEM_START_CONTROL', 'SYSTEM_STOP_CONTROL'])
      .order('timestamp', { ascending: false })
      .limit(1);

    if (logsData && logsData.length > 0) {
      return logsData[0].event_type === 'SYSTEM_STOP_CONTROL' ? 'STOPPED' : 'RUNNING';
    }

    return 'RUNNING';
  } catch (error) {
    console.warn('Error fetching system status, fallback to RUNNING:', error.message);
    return 'RUNNING';
  }
}

/**
 * Check if system is running
 */
export async function isSystemRunning() {
  const status = await getSystemStatus();
  return status === 'RUNNING';
}

/**
 * Update system status ('RUNNING' or 'STOPPED')
 */
export async function setSystemStatus(newStatus) {
  if (newStatus !== 'RUNNING' && newStatus !== 'STOPPED') {
    throw new Error("Invalid status. Must be 'RUNNING' or 'STOPPED'.");
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin client unavailable.');
  }

  // 1. Try to upsert in system_settings
  try {
    await supabaseAdmin
      .from('system_settings')
      .upsert({ key: 'SYSTEM_STATUS', value: newStatus, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn('Unable to upsert to system_settings:', e.message);
  }

  // 2. Insert master control log into system_activity_logs
  const eventType = newStatus === 'RUNNING' ? 'SYSTEM_START_CONTROL' : 'SYSTEM_STOP_CONTROL';
  const message = newStatus === 'RUNNING' 
    ? '🟢 SYSTEM STARTED (MULAI): Sakelar utama diaktifkan. Semua agen AI diperbolehkan berjalan non-stop!'
    : '🔴 SYSTEM STOPPED (BERHENTI): Sakelar utama dimatikan! DILARANG ADA AGEN YANG BERJALAN SATUPUN!';

  await supabaseAdmin.from('system_activity_logs').insert([{
    event_type: eventType,
    agent_stage: 0,
    message: message
  }]);

  return newStatus;
}
