"use client"

// Este arquivo é automaticamente gerado. Não o edite diretamente.
import { createClient } from '@supabase/supabase-js';

// Usando variáveis de ambiente para segurança e flexibilidade
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ihwmsjfnpirlfcuptima.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod21zamZucGlybGZjdXB0aW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzM3MTEsImV4cCI6MjA3NjA0OTcxMX0.ypLuY922CoMxsoTMpZb8BEYRU9jusHVrDYpp_aMx3R4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);