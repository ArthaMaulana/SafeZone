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
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className={`p-2 rounded-full transition-colors ${userVote === 1 ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-green-100'}`}
        aria-label="Upvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
      </button>
      <span className="font-bold text-lg">{score}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className={`p-2 rounded-full transition-colors ${userVote === -1 ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-red-100'}`}
        aria-label="Downvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-7.293l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};

export default VoteButtons;
