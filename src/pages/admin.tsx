// src/pages/admin.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Report {
  report_id: number;
  user_id: string;
  reporter_name: string;
  description: string;
  category: string;
  status: string;
  lat: number;
  lng: number;
  end_lat?: number;
  end_lng?: number;
  photo_url?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
  admin_email?: string;
  upvotes: number;
  downvotes: number;
  score: number;
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [reviewedReports, setReviewedReports] = useState<Report[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if user is admin
        const { data: isAdminResult } = await supabase.rpc('is_user_admin');
        setIsAdmin(isAdminResult || false);
        
        if (isAdminResult) {
          loadPendingReports();
          loadReviewedReports();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReports = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pending_reports');
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Failed to load pending reports:', error);
    }
  };

  const loadReviewedReports = async () => {
    try {
      console.log('Loading reviewed reports...');
      const { data, error } = await supabase.rpc('get_reviewed_reports');
      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      console.log('Reviewed reports data:', data);
      setReviewedReports(data || []);
    } catch (error) {
      console.error('Failed to load reviewed reports:', error);
      // Fallback: try to get reports directly from table
      try {
        console.log('Trying fallback query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('reports')
          .select('*')
          .in('status', ['approved', 'rejected'])
          .order('reviewed_at', { ascending: false });
        
        if (fallbackError) {
          console.error('Fallback error:', fallbackError);
        } else {
          console.log('Fallback data:', fallbackData);
          const processedData = fallbackData?.map(report => ({
            report_id: report.id,
            user_id: report.user_id,
            reporter_name: report.reporter_name,
            description: report.description,
            category: report.category,
            status: report.status,
            lat: report.lat,
            lng: report.lng,
            end_lat: report.end_lat,
            end_lng: report.end_lng,
            photo_url: report.photo_url,
            created_at: report.created_at,
            reviewed_at: report.reviewed_at,
            reviewed_by: report.reviewed_by,
            admin_notes: report.admin_notes,
            admin_email: 'Unknown Admin',
            upvotes: 0,
            downvotes: 0,
            score: 0
          })) || [];
          setReviewedReports(processedData);
        }
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
      }
    }
  };

  const updateReportStatus = async (reportId: number, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('admin_update_report_status', {
        report_id_param: reportId,
        new_status: newStatus,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      // Refresh reports list
      await loadPendingReports();
      await loadReviewedReports();
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `Laporan berhasil ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}!`
      });
      
      // Close modal after short delay
      setTimeout(() => {
        setSelectedReport(null);
        setAdminNotes('');
        setNotification(null);
      }, 1500);
    } catch (error) {
      console.error('Failed to update report status:', error);
      setNotification({
        type: 'error',
        message: 'Gagal mengupdate status laporan'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      crime: '🚨',
      road: '🚧',
      flood: '🌊',
      lamp: '💡',
      accident: '⚠️',
      disaster: '🔥',
      other: '📍'
    };
    return icons[category] || '📍';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600 mb-4">Anda harus login untuk mengakses dashboard admin</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-4">Anda tidak memiliki akses admin</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SafeZone Admin Dashboard</h1>
              <p className="text-gray-600">Kelola laporan komunitas</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin: {user.email}</span>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Kembali ke Map
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total Laporan Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{reports.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Perlu Review</h3>
            <p className="text-3xl font-bold text-orange-600">
              {reports.filter(r => r.status === 'open').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Pending Review</h3>
            <p className="text-3xl font-bold text-blue-600">
              {reports.filter(r => r.status === 'pending_review').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total Direview</h3>
            <p className="text-3xl font-bold text-green-600">{reviewedReports.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Laporan Pending ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History Review ({reviewedReports.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Reports List */}
        {activeTab === 'pending' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Laporan Menunggu Persetujuan</h2>
            </div>
            
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Tidak ada laporan yang menunggu persetujuan
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <div key={report.report_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getCategoryIcon(report.category)}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {report.category.toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Laporan #{report.report_id}
                        </h3>
                        
                        <p className="text-gray-700 mb-3">{report.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Pelapor:</strong> {report.reporter_name || 'Anonymous'}
                          </div>
                          <div>
                            <strong>Tanggal:</strong> {formatDate(report.created_at)}
                          </div>
                          <div>
                            <strong>Lokasi:</strong> {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
                          </div>
                          <div>
                            <strong>Score:</strong> {report.score} ({report.upvotes} ↑ {report.downvotes} ↓)
                          </div>
                        </div>

                        {report.photo_url && (
                          <div className="mt-3">
                            <img 
                              src={report.photo_url} 
                              alt="Report photo" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex-shrink-0">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">History Review Laporan</h2>
            </div>
            
            {reviewedReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Belum ada laporan yang direview
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reviewedReports.map((report) => (
                  <div key={report.report_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getCategoryIcon(report.category)}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {report.category.toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {report.status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Laporan #{report.report_id}
                        </h3>
                        
                        <p className="text-gray-700 mb-3">{report.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <strong>Pelapor:</strong> {report.reporter_name || 'Anonymous'}
                          </div>
                          <div>
                            <strong>Tanggal Laporan:</strong> {formatDate(report.created_at)}
                          </div>
                          <div>
                            <strong>Lokasi:</strong> {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
                          </div>
                          <div>
                            <strong>Score:</strong> {report.score} ({report.upvotes} ↑ {report.downvotes} ↓)
                          </div>
                        </div>

                        {/* Admin Review Info */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong className="text-gray-700">Direview oleh:</strong>
                              <p className="text-gray-600">{report.admin_email || 'Unknown Admin'}</p>
                            </div>
                            <div>
                              <strong className="text-gray-700">Tanggal Review:</strong>
                              <p className="text-gray-600">{report.reviewed_at ? formatDate(report.reviewed_at) : '-'}</p>
                            </div>
                          </div>
                          {report.admin_notes && (
                            <div className="mt-2">
                              <strong className="text-gray-700">Catatan Admin:</strong>
                              <p className="text-gray-600 mt-1">{report.admin_notes}</p>
                            </div>
                          )}
                        </div>

                        {report.photo_url && (
                          <div className="mt-3">
                            <img 
                              src={report.photo_url} 
                              alt="Report photo" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Review Laporan #{selectedReport.report_id}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getCategoryIcon(selectedReport.category)}</span>
                    <span className="text-gray-900">{selectedReport.category.toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Saat Ini</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedReport.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedReport.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReport.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pelapor</label>
                  <p className="text-gray-900">{selectedReport.reporter_name || 'Anonymous'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Laporan</label>
                  <p className="text-gray-900">{formatDate(selectedReport.created_at)}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <p className="text-gray-900">
                  Start: {selectedReport.lat.toFixed(6)}, {selectedReport.lng.toFixed(6)}
                  {selectedReport.end_lat && selectedReport.end_lng && (
                    <><br />End: {selectedReport.end_lat.toFixed(6)}, {selectedReport.end_lng.toFixed(6)}</>
                  )}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Community Score</label>
                <p className="text-gray-900">
                  Score: {selectedReport.score} ({selectedReport.upvotes} upvotes, {selectedReport.downvotes} downvotes)
                </p>
              </div>

              {selectedReport.photo_url && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
                  <img 
                    src={selectedReport.photo_url} 
                    alt="Report photo" 
                    className="w-full max-w-md h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Admin (Opsional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk keputusan ini..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={actionLoading}
                >
                  Batal
                </button>
                <button
                  onClick={() => updateReportStatus(selectedReport.report_id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Memproses...' : 'Tolak'}
                </button>
                <button
                  onClick={() => updateReportStatus(selectedReport.report_id, 'approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Memproses...' : 'Setujui'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
