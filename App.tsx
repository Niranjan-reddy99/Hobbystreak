import React from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>✅ Supabase Connected</h1>
      <p>If this loads, the import path is fixed.</p>
    </div>
  );
}
