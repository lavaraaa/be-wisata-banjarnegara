const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksjglnabyjehcodgvssp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzamdsbmFieWplaGNvZGd2c3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc3MDIzNiwiZXhwIjoyMDgwMzQ2MjM2fQ.Kf_cG9DMCGCOGy1FnwvlVMTdsWikGlewnhKDdPXigx4';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
