// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = "https://pxezuuumgzdzdiqsspig.supabase.co";

const SUPABASE_KEY = "sb_publishable_i--xXc0Jso51OAYj8Vy92g_OVIt8e3x";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        }
    );
// ======================================
// SIDAT APP VERSION
// ======================================

const SIDAT_APP_VERSION = "2026.08.28.01";
