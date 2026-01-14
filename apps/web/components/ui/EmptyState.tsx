'use client';

import Link from 'next/link';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function NoTransactionsEmpty() {
  return (
    <EmptyState
      icon="💸"
      title="Henüz işlem yok"
      description="İşlemlerinizi manuel olarak ekleyebilir veya banka ekstrenizi PDF olarak yükleyebilirsiniz."
      action={{ label: 'PDF Yükle', href: '/dashboard/upload' }}
      secondaryAction={{ label: 'Manuel Ekle', href: '/dashboard/transactions?add=true' }}
    />
  );
}

export function NoBudgetsEmpty() {
  return (
    <EmptyState
      icon="📊"
      title="Henüz bütçe yok"
      description="Harcamalarınızı kontrol altında tutmak için kategori bazlı bütçeler oluşturun."
      action={{ label: 'Bütçe Oluştur', href: '/dashboard/budgets?add=true' }}
    />
  );
}

export function NoGoalsEmpty() {
  return (
    <EmptyState
      icon="🎯"
      title="Henüz hedef yok"
      description="Tasarruf hedefleri belirleyerek finansal hedeflerinize ulaşın."
      action={{ label: 'Hedef Oluştur', href: '/dashboard/goals?add=true' }}
    />
  );
}

export function NoDataEmpty() {
  return (
    <EmptyState
      icon="📭"
      title="Veri bulunamadı"
      description="Aradığınız kriterlere uygun veri bulunamadı. Filtreleri değiştirmeyi deneyin."
    />
  );
}

export function ErrorState({
  message = 'Bir hata oluştu',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="⚠️"
      title="Hata"
      description={message}
      action={onRetry ? { label: 'Tekrar Dene', onClick: onRetry } : undefined}
    />
  );
}

export function LoadingFailed({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="🔌"
      title="Bağlantı hatası"
      description="Veriler yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin."
      action={onRetry ? { label: 'Tekrar Dene', onClick: onRetry } : undefined}
    />
  );
}
