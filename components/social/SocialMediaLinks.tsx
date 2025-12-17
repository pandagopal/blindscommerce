'use client';

import React, { useState, useEffect } from 'react';

interface SocialAccount {
  id: number;
  platform: string;
  accountName: string;
  accountUrl: string;
  iconClass: string;
  displayOrder: number;
}

interface SocialMediaLinksProps {
  position?: 'header' | 'footer';
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  position = 'footer',
  size = 'medium',
  orientation = 'horizontal',
  showLabels = false,
  className = ''
}) => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialAccounts();
  }, [position]);

  const fetchSocialAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/content/social-accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch social accounts');
      }

      const data = await response.json();
      
      if (data.success) {
        // Extract accounts from V2 API response format
        const accountsData = data.data?.accounts || data.accounts || [];
        
        // Filter accounts based on position
        const filteredAccounts = accountsData.filter((account: any) => {
          if (position === 'header') {
            return account.showInHeader;
          } else {
            return account.showInFooter;
          }
        });
        
        setAccounts(filteredAccounts);
      } else {
        throw new Error(data.error || 'Failed to load social accounts');
      }
    } catch (err) {
      console.error('Error fetching social accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load social media links');
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6 text-sm';
      case 'large':
        return 'w-10 h-10 text-xl';
      default:
        return 'w-8 h-8 text-base';
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'flex items-center';
    const orientationClasses = orientation === 'vertical' ? 'flex-col space-y-2' : 'space-x-3';
    return `${baseClasses} ${orientationClasses}`;
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      facebook: 'hover:text-blue-600',
      instagram: 'hover:text-primary-red',
      twitter: 'hover:text-blue-400',
      linkedin: 'hover:text-blue-700',
      youtube: 'hover:text-red-600',
      pinterest: 'hover:text-red-500',
      tiktok: 'hover:text-black'
    };
    return colors[platform as keyof typeof colors] || 'hover:text-gray-600';
  };

  const trackSocialClick = async (account: SocialAccount) => {
    try {
      // Track the social media click for analytics
      const response = await fetch('/api/v2/content/social/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: account.platform,
          accountId: account.id,
          interactionType: 'click',
          source: position,
          referrerUrl: window.location.href
        }),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to track interaction');
      }
    } catch (error) {
      // Silently fail - don't let tracking errors affect user experience
      console.warn('Failed to track social media click:', error);
    }
  };

  const handleSocialClick = (account: SocialAccount) => {
    trackSocialClick(account);
    // The link will naturally navigate due to the href attribute
  };

  if (loading) {
    return (
      <div className={`${getContainerClasses()} ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`${getSizeClasses()} bg-gray-200 rounded animate-pulse`}
          />
        ))}
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return null; // Don't show anything if there's an error or no accounts
  }

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      {accounts.map((account) => (
        <a
          key={account.id}
          href={account.accountUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleSocialClick(account)}
          className={`
            ${getSizeClasses()}
            flex items-center justify-center
            text-gray-600 ${getPlatformColor(account.platform)}
            transition-colors duration-200
            rounded-full
            ${showLabels ? 'space-x-2' : ''}
            group
          `}
          title={`Follow us on ${account.platform}`}
          aria-label={`Follow ${account.accountName} on ${account.platform}`}
        >
          {/* Icon */}
          {account.iconClass ? (
            <i className={account.iconClass} />
          ) : (
            <span className="font-bold text-xs uppercase">
              {account.platform.substring(0, 2)}
            </span>
          )}
          
          {/* Label (if enabled) */}
          {showLabels && (
            <span className="text-sm font-medium capitalize group-hover:underline">
              {account.platform}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialMediaLinks;