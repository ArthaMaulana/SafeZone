// src/components/VoteButtons.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface VoteButtonsProps {
  reportId: number;
  initialScore: number;
}

const VoteButtons = ({ reportId, initialScore }: VoteButtonsProps) => {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(null); // -1, 0, or 1
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserVote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('votes')
        .select('value')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserVote(data.value);
      }
    };

    fetchUserVote();
  }, [reportId]);

  const handleVote = async (value: 1 | -1) => {
    setIsLoading(true);
    
    // Use anonymous user ID for voting
    const anonymousUserId = 'anonymous-user';
    
    // Jika pengguna mengklik tombol yang sama lagi, batalkan vote
    const newValue = userVote === value ? 0 : value;

    try {
      // Insert vote to database
      if (newValue === 0) {
        // Delete vote if cancelling
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', anonymousUserId);
        
        if (error) console.error('Error deleting vote:', error);
      } else {
        // Upsert vote
        const { error } = await supabase.from('votes').upsert({
          report_id: reportId,
          user_id: anonymousUserId,
          value: newValue,
        }, {
          onConflict: 'report_id,user_id'
        });

        if (error) console.error('Error saving vote:', error);
      }

      // Update score secara lokal untuk responsivitas instan
      // Ini akan disinkronkan oleh Supabase Realtime nantinya
      let scoreChange = 0;
      if (newValue === 0) { // Vote dibatalkan
        scoreChange = -userVote!;
      } else if (userVote === 0 || userVote === null) { // Vote baru
        scoreChange = newValue;
      } else { // Mengubah vote
        scoreChange = newValue - userVote;
      }
      
      setScore(prev => prev + scoreChange);
      setUserVote(newValue === 0 ? null : newValue);

    } catch (err: any) {
      console.error('Error voting:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
      <div className="text-center mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Skor Komunitas</span>
      </div>
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => handleVote(1)}
          disabled={isLoading}
          className={`group relative p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            userVote === 1 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25' 
              : 'bg-white/80 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          aria-label="Upvote"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {userVote === 1 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </button>
        
        <div className="text-center px-4">
          <div className={`text-2xl font-bold transition-colors duration-200 ${
            score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {score > 0 ? '+' : ''}{score}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.abs(score) === 1 ? 'vote' : 'votes'}
          </div>
        </div>
        
        <button
          onClick={() => handleVote(-1)}
          disabled={isLoading}
          className={`group relative p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            userVote === -1 
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25' 
              : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          aria-label="Downvote"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {userVote === -1 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center mt-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-500">Memproses...</span>
        </div>
      )}
    </div>
  );
};

export default VoteButtons;
