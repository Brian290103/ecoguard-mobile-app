import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ecoguard-supabase.uisen-global.com/";
// const supabaseUrl =
//   "http://supabasekong-xocw8k8c8c0s44s8cog0s0kk.130.61.203.124.sslip.io/";
const supabasePublishableKey =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDg4MzY2MCwiZXhwIjo0OTE2NTU3MjYwLCJyb2xlIjoiYW5vbiJ9.vFElDK_t124pv61BR4OeUz7clVPw4ApEzKl2S-PHMVc";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
