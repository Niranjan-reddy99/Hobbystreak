import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. CONFIGURATION
// using import.meta.env for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// FORCE MEMORY STORAGE (Fixes "Access to storage is not allowed")
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't try to save to disk/cookies
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export default function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  const log = (msg: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${isError ? '❌' : '✅'} ${msg}`, ...prev]);
  };

  // TEST 1: Check Connection & Read
  const testConnection = async () => {
    log("Testing Database Connection...");
    const { data, error } = await supabase.from('hobbies').select('*').limit(1);
    
    if (error) {
        log(`Connection Failed: ${error.message} (Code: ${error.code})`, true);
        console.error(error);
    } else {
        log(`Connection Success! Found ${data.length} hobbies.`);
        if (data.length > 0) {
            log(`First Hobby Columns: ${Object.keys(data[0]).join(', ')}`);
        }
    }
  };

  // TEST 2: Test Login/Signup
  const testAuth = async () => {
    const email = `testuser${Math.floor(Math.random() * 1000)}@example.com`;
    const password = "password123";
    log(`Attempting to create user: ${email}...`);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        log(`Auth Failed: ${error.message}`, true);
    } else if (data.user) {
        log(`Auth Success! User ID: ${data.user.id}`);
        setUser(data.user);
        
        // Create Profile manually to ensure it exists
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            name: "Test User"
        });
        if (profileError) log(`Profile Creation Failed: ${profileError.message}`, true);
        else log("Profile Created Successfully");
    }
  };

  // TEST 3: Test Posting (The part that was breaking)
  const testPost = async () => {
    if (!user) return log("Login first!", true);
    
    log("Attempting to Post...");
    
    // We try to insert with NO hobby_id first to test raw permissions
    const { data, error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: "Diagnostic Test Post",
        hobby_id: null 
    }).select();

    if (error) {
        log(`Post Failed: ${error.message} (Details: ${error.details})`, true);
    } else {
        log("Post Success! Data saved to DB.");
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: 'yellow' }}>Supabase Diagnostic Tool</h1>
      
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <button onClick={testConnection} style={{ padding: '10px 20px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer' }}>
            1. Test Database Read
        </button>
        <button onClick={testAuth} style={{ padding: '10px 20px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer' }}>
            2. Test Auth (Create User)
        </button>
        <button onClick={testPost} style={{ padding: '10px 20px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer' }}>
            3. Test Posting
        </button>
      </div>

      <div style={{ background: '#000', padding: 20, borderRadius: 8, border: '1px solid #333' }}>
        <h3>Logs:</h3>
        {logs.map((l, i) => (
            <div key={i} style={{ marginBottom: 5, color: l.includes('❌') ? '#ff5555' : '#55ff55' }}>
                {l}
            </div>
        ))}
      </div>
    </div>
  );
}
