// js/config.js — Налаштування Supabase

var SUPABASE_URL = 'https://jmybpqkvesugjljpgdtr.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWJwcWt2ZXN1Z2psanBnZHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTM3NjYsImV4cCI6MjA4Njc2OTc2Nn0.PDYDXPIJQfz8MWd3PyD5tRM3dWADwuMsfrs9BM-P9GM';

var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
