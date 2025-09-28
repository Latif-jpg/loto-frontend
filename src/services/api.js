// src/services/Api.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ouzjrtwllflgeutkgurj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91empydHdsbGZsZ2V1dGtndXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjQzNzksImV4cCI6MjA3NDEwMDM3OX0.fVHihUI_vClT-XvZ1JD40h7bcOtbcDFa7y7jwwZ8I4c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
