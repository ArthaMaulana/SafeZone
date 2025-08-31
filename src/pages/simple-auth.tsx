import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SimpleAuth() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setMessage(`Sign up error: ${error.message}`);
      } else {
        setMessage(`Sign up successful! User: ${data.user?.email}`);
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err}`);
    }
    
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setMessage(`Sign in error: ${error.message}`);
      } else {
        setMessage(`Sign in successful! User: ${data.user?.email}`);
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err}`);
    }
    
    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error) {
        setMessage(`Connection error: ${error.message}`);
      } else {
        setMessage(`Connection successful! Data: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setMessage(`Connection failed: ${err}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Simple Auth Test</h1>
      
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
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '5px 0' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test Connection
        </button>
        
        <button 
          onClick={handleSignUp} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Sign Up
        </button>
        
        <button 
          onClick={handleSignIn} 
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          Sign In
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {message && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: message.includes('error') || message.includes('failed') ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${message.includes('error') || message.includes('failed') ? '#f44336' : '#4caf50'}`,
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
