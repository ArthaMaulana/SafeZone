import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BypassAuth() {
  const [email, setEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.rpc('create_test_user', {
        user_email: email
      });
      
      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err}`);
    }
    
    setLoading(false);
  };

  const testSupabaseAuth = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Try normal Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
      });
      
      if (error) {
        setMessage(`Supabase Auth Error: ${error.message}`);
      } else {
        setMessage(`Supabase Auth Success: ${JSON.stringify(data.user, null, 2)}`);
      }
    } catch (err) {
      setMessage(`Auth failed: ${err}`);
    }
    
    setLoading(false);
  };

  const checkProfiles = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (error) {
        setMessage(`Profiles Error: ${error.message}`);
      } else {
        setMessage(`Profiles Data: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setMessage(`Profiles failed: ${err}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Auth Bypass Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '5px 0' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={checkProfiles} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none' }}
        >
          Check Profiles
        </button>
        
        <button 
          onClick={createTestUser} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none' }}
        >
          Create User (Bypass)
        </button>
        
        <button 
          onClick={testSupabaseAuth} 
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: '#ff9800', color: 'white', border: 'none' }}
        >
          Test Supabase Auth
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {message && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: message.includes('Error') || message.includes('failed') ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${message.includes('Error') || message.includes('failed') ? '#f44336' : '#4caf50'}`,
          borderRadius: '4px',
          marginTop: '20px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>First run <code>fix_rls_simple.sql</code> in Supabase SQL Editor</li>
          <li>Then run <code>bypass_auth.sql</code> in Supabase SQL Editor</li>
          <li>Click "Check Profiles" to test database connection</li>
          <li>Click "Create User (Bypass)" to create user without auth</li>
          <li>Click "Test Supabase Auth" to test normal authentication</li>
        </ol>
      </div>
    </div>
  );
}
