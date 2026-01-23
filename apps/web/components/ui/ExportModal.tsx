'use client';

import { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Lock, Crown } from 'lucide-react';
import { Button } from './Button';
import { useToast } from './Toast';
import { useAuth } from '@/components/auth-provider';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { start: string; end: string };
  transactionType?: 'income' | 'expense' | 'all';
}

interface UserPlan {
  planName: string;
  features: {
    exportCsv: boolean;
    exportPdf: boolean;
  };
}

export function ExportModal({ isOpen, onClose, dateRange, transactionType }: ExportModalProps) {
  const { fetchWithAuth } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Load user plan when modal opens
  useState(() => {
    if (isOpen && !planLoaded) {
      loadUserPlan();
    }
  });

  const loadUserPlan = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/billing/plan`);
      if (res.ok) {
        const data = await res.json();
        setUserPlan(data);
      }
    } catch (error) {
      console.error('Failed to load user plan:', error);
    } finally {
      setPlanLoaded(true);
    }
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (dateRange?.start) params.set('dateFrom', dateRange.start);
    if (dateRange?.end) params.set('dateTo', dateRange.end);
    if (transactionType && transactionType !== 'all') params.set('type', transactionType);
    return params.toString();
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setLoading(format);

    try {
      const query = buildQueryString();
      const endpoint = `${API_URL}/export/${format}${query ? `?${query}` : ''}`;

      const res = await fetchWithAuth(endpoint);

      if (res.status === 403) {
        showToast('Bu özellik için Premium plan gerekli', 'warning');
        setLoading(null);
        return;
      }

      if (!res.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await res.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from content-disposition header or generate one
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `islemler-${new Date().toISOString().split('T')[0]}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      } else {
        filename += format === 'csv' ? '.csv' : format === 'excel' ? '.xlsx' : '.pdf';
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const formatName = format === 'csv' ? 'CSV' : format === 'excel' ? 'Excel' : 'PDF';
      showToast(`${formatName} dosyası indirildi!`, 'success');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      showToast('Dışa aktarma başarısız oldu', 'error');
    } finally {
      setLoading(null);
    }
  };

  const canExportCsv = userPlan?.features?.exportCsv ?? false;
  const canExportPdf = userPlan?.features?.exportPdf ?? false;
  const isPremium = userPlan?.planName === 'pro' || userPlan?.planName === 'business';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dışa Aktar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Date range info */}
          {dateRange && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Dönem: {dateRange.start || 'Başlangıç'} - {dateRange.end || 'Şimdi'}
            </div>
          )}

          {/* Export options */}
          <ExportOption
            icon={<FileSpreadsheet className="w-6 h-6" />}
            title="CSV"
            description="Excel ve diğer programlarla uyumlu"
            onClick={() => handleExport('csv')}
            loading={loading === 'csv'}
            locked={!canExportCsv}
            isPremiumFeature={true}
          />

          <ExportOption
            icon={<FileSpreadsheet className="w-6 h-6 text-green-600" />}
            title="Excel (XLSX)"
            description="Formatlı ve renkli Excel raporu"
            onClick={() => handleExport('excel')}
            loading={loading === 'excel'}
            locked={!canExportCsv}
            isPremiumFeature={true}
          />

          <ExportOption
            icon={<FileText className="w-6 h-6 text-red-500" />}
            title="PDF Rapor"
            description="Profesyonel finansal rapor"
            onClick={() => handleExport('pdf')}
            loading={loading === 'pdf'}
            locked={!canExportPdf}
            isPremiumFeature={true}
          />

          {/* Premium upsell */}
          {!isPremium && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Premium Özellik
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    CSV, Excel ve PDF dışa aktarma Pro ve Business planlarında aktif.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3 bg-amber-500 hover:bg-amber-600"
                    onClick={() => {
                      onClose();
                      window.location.href = '/dashboard/settings?tab=billing';
                    }}
                  >
                    Planı Yükselt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ExportOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  locked?: boolean;
  isPremiumFeature?: boolean;
}

function ExportOption({
  icon,
  title,
  description,
  onClick,
  loading,
  locked,
  isPremiumFeature
}: ExportOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || locked}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
        locked
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-md'
      }`}
    >
      <div className={`${locked ? 'opacity-50' : ''}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${locked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {title}
          </span>
          {isPremiumFeature && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
              Pro
            </span>
          )}
        </div>
        <p className={`text-sm ${locked ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
          {description}
        </p>
      </div>
      <div>
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
        ) : locked ? (
          <Lock className="w-5 h-5 text-gray-400" />
        ) : (
          <Download className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </button>
  );
}
