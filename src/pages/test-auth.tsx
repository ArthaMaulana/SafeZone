// Test page untuk debug authentication
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TestAuth() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing connection...');
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        setResult(`Connection Error: ${error.message}`);
      } else {
        setResult('Connection successful!');
      }
    } catch (err: any) {
      setResult(`Exception: ${err.message}`);
    }
    
    setLoading(false);
  };

  const testAuth = async () => {
    setLoading(true);
    setResult('Testing auth...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test${Date.now()}@test.com`,
        password: '123456'
      });
      
      if (error) {
        setResult(`Auth Error: ${error.message}`);
      } else {
        setResult(`Auth Success: ${data.user?.id}`);
      }
    } catch (err: any) {
      setResult(`Auth Exception: ${err.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testConnection} disabled={loading}>
          Test Connection
        </button>
        <button onClick={testAuth} disabled={loading} style={{ marginLeft: '10px' }}>
          Test Auth
        </button>
      </div>
      
      <div style={{ 
        padding: '10px', 
        border: '1px solid #ccc', 
        backgroundColor: '#f5f5f5',
        minHeight: '100px'
      }}>
        {result}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Environment Check:</h3>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
      </div>
    </div>
  );
}
