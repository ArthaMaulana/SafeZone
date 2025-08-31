// src/components/ReportStats.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Report {
  report_id: number;
  description: string;
  category: string;
  status: string;
  created_at: string;
  score: number;
  upvotes: number;
  downvotes: number;
}

interface ReportStatsProps {
  isAdmin?: boolean;
}

const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'crime': '🚨',
    'road': '🚧',
    'flood': '🌊',
    'lamp': '💡',
    'accident': '⚠️',
    'disaster': '🔥',
    'other': '📍',
  };
  return iconMap[category] || iconMap['other'];
};

const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'crime': '#dc2626',
    'road': '#f59e0b',
    'flood': '#2563eb',
    'lamp': '#7c3aed',
    'accident': '#ea580c',
    'disaster': '#16a34a',
    'other': '#6b7280',
  };
  return colorMap[category] || colorMap['other'];
};

const ReportStats: React.FC<ReportStatsProps> = ({ isAdmin = false }) => {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular' | 'resolved'>('latest');
  const [latestReports, setLatestReports] = useState<Report[]>([]);
  const [popularReports, setPopularReports] = useState<Report[]>([]);
  const [resolvedReports, setResolvedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Add realtime channel state
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    loadLatestReports();
    loadPopularReports();
    loadResolvedReports();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('report_stats_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          console.log('Reports table changed, refreshing stats...');
          loadLatestReports();
          loadPopularReports();
          loadResolvedReports();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          console.log('Votes table changed, refreshing stats...');
          loadLatestReports();
          loadPopularReports();
          loadResolvedReports();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('ReportStats realtime subscription active');
        }
      });
    
    setRealtimeChannel(channel);
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAdmin]);

  const loadLatestReports = async () => {
    try {
      console.log('Loading latest reports, isAdmin:', isAdmin);
      const { data, error } = await supabase
        .from('reports')
        .select('id, description, category, status, created_at')
.in('status', ['pending_review', 'open', 'approved', 'verified'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      console.log('Raw reports data:', data);
      console.log('Reports count:', data?.length);
      if (data && data.length > 0) {
        console.log('Latest report created_at:', data[0].created_at);
        console.log('Oldest report created_at:', data[data.length - 1].created_at);
      }
      
      // Add score calculation
      const reportsWithScores = await Promise.all(
        (data || []).map(async (report: any) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('report_id', report.id);
          
          const upvotes = votes?.filter(v => v.vote_type === 'upvote').length || 0;
          const downvotes = votes?.filter(v => v.vote_type === 'downvote').length || 0;
          
          return {
            report_id: report.id,
            description: report.description,
            category: report.category,
            status: report.status,
            created_at: report.created_at,
            upvotes,
            downvotes,
            score: upvotes - downvotes
          };
        })
      );
      
      console.log('Final reports with scores:', reportsWithScores);
      setLatestReports(reportsWithScores.slice(0, 5));
    } catch (error) {
      console.error('Failed to load latest reports:', error);
    }
  };

  const loadPopularReports = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_reports_with_scores');
      if (error) throw error;
      
      const filteredReports = (data || [])
        .filter((report: any) => 
          isAdmin ? true : ['approved', 'verified'].includes(report.status)
        )
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5)
        .map((report: any) => ({
          report_id: report.report_id,
          description: report.description,
          category: report.category,
          status: report.status,
          created_at: report.created_at,
          score: report.score,
          upvotes: report.upvotes,
          downvotes: report.downvotes
        }));
      
      setPopularReports(filteredReports);
    } catch (error) {
      console.error('Failed to load popular reports:', error);
    }
  };

  const loadResolvedReports = async () => {
    try {
      // First try to get resolved reports, if none exist, get approved reports as fallback
      const { data, error } = await supabase
        .from('reports')
        .select('id, description, category, status, created_at')
        .in('status', ['resolved', 'approved'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Add score calculation
      const reportsWithScores = await Promise.all(
        (data || []).map(async (report: any) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('report_id', report.id);
          
          const upvotes = votes?.filter(v => v.vote_type === 'upvote').length || 0;
          const downvotes = votes?.filter(v => v.vote_type === 'downvote').length || 0;
          
          return {
            report_id: report.id,
            description: report.description,
            category: report.category,
            status: report.status,
            created_at: report.created_at,
            upvotes,
            downvotes,
            score: upvotes - downvotes
          };
        })
      );
      
      setResolvedReports(reportsWithScores);
    } catch (error) {
      console.error('Failed to load resolved reports:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'latest') {
          await loadLatestReports();
        } else if (activeTab === 'popular') {
          await loadPopularReports();
        } else if (activeTab === 'resolved') {
          await loadResolvedReports();
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, isAdmin]);

  const getCurrentReports = () => {
    switch (activeTab) {
      case 'latest': return latestReports;
      case 'popular': return popularReports;
      case 'resolved': return resolvedReports;
      default: return [];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string } } = {
      'pending_review': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'open': { label: 'Open', color: 'bg-orange-100 text-orange-800' },
      'approved': { label: 'Approved', color: 'bg-green-100 text-green-800' },
      'verified': { label: 'Verified', color: 'bg-blue-100 text-blue-800' },
      'resolved': { label: 'Resolved', color: 'bg-gray-100 text-gray-800' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('latest')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'latest'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📅 Terbaru
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'popular'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔥 Populer
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'resolved'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✅ Disetujui
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Memuat...</p>
          </div>
        ) : getCurrentReports().length > 0 ? (
          <div className="space-y-3">
            {getCurrentReports().map((report) => (
              <div
                key={report.report_id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => router.push(`/report/${report.report_id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon(report.category)}</span>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(report.category) }}
                    >
                      {report.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-700">
                      {report.score > 0 ? '+' : ''}{report.score}
                    </span>
                    {isAdmin && getStatusBadge(report.status)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                  {report.description}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{formatDate(report.created_at)}</span>
                  <span>{report.upvotes} ↑ {report.downvotes} ↓</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">
              {activeTab === 'latest' && 'Belum ada laporan terbaru'}
              {activeTab === 'popular' && 'Belum ada laporan populer'}
              {activeTab === 'resolved' && 'Belum ada laporan yang disetujui'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportStats;
