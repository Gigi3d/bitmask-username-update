'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AnalyticsData } from '@/types';
import { db } from '@/lib/instantdb';

type ChartTooltipPayload = {
  name: string;
  value: number;
  color?: string;
};

interface ErrorDetails {
  message: string;
  details?: string;
}

export default function Analytics() {
  const { user } = db.useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Query admin_users to check if current user is a superadmin
  const { data: adminData } = db.useQuery({ admin_users: {} });

  useEffect(() => {
    if (adminData?.admin_users && user?.email) {
      const adminUsersArray = Array.isArray(adminData.admin_users) 
        ? adminData.admin_users 
        : Object.values(adminData.admin_users);
      const currentUserAdmin = (adminUsersArray as Array<{ email?: string; role?: string }>)
        .find((admin) => admin.email?.toLowerCase() === user.email?.toLowerCase());
      setIsSuperAdmin(currentUserAdmin?.role === 'superadmin' || false);
    }
  }, [adminData, user]);

  // Memoize fetch function to prevent unnecessary re-creations
  const fetchAnalytics = useCallback(async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/data', {
        headers: {
          'x-user-email': user.email,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to fetch analytics';
        throw new Error(errorMessage);
      }
      
      const analyticsData = await response.json();
      
      // Validate data structure
      if (!analyticsData || typeof analyticsData !== 'object') {
        throw new Error('Invalid data format received from server');
      }
      
      // Ensure all required fields exist with defaults
      const validatedData: AnalyticsData = {
        totalUpdates: analyticsData.totalUpdates ?? 0,
        updatesPerDay: Array.isArray(analyticsData.updatesPerDay) ? analyticsData.updatesPerDay : [],
        updatesPerWeek: Array.isArray(analyticsData.updatesPerWeek) ? analyticsData.updatesPerWeek : [],
        successRate: analyticsData.successRate ?? 0,
        activityTimeline: Array.isArray(analyticsData.activityTimeline) ? analyticsData.activityTimeline : [],
      };
      
      setData(validatedData);
      setError(null);
      setLastRefresh(new Date());
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      const errorDetails = process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.stack
        : undefined;
      
      setError({
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      fetchAnalytics();
      // Refresh every 30 seconds
      const interval = setInterval(() => fetchAnalytics(), 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchAnalytics]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchAnalytics();
  };

  // Calculate additional metrics
  const calculateMetrics = () => {
    if (!data) return null;

    const { updatesPerDay, updatesPerWeek, totalUpdates } = data;
    
    // Average per day
    const avgPerDay = updatesPerDay.length > 0
      ? (totalUpdates / updatesPerDay.length).toFixed(1)
      : '0';

    // Peak day
    const peakDay = updatesPerDay.length > 0
      ? updatesPerDay.reduce((max, day) => day.count > max.count ? day : max, updatesPerDay[0])
      : null;

    // Peak week
    const peakWeek = updatesPerWeek.length > 0
      ? updatesPerWeek.reduce((max, week) => week.count > max.count ? week : max, updatesPerWeek[0])
      : null;

    // Trend (compare last week to previous week)
    let trend = null;
    if (updatesPerWeek.length >= 2) {
      const lastWeek = updatesPerWeek[updatesPerWeek.length - 1].count;
      const prevWeek = updatesPerWeek[updatesPerWeek.length - 2].count;
      const diff = lastWeek - prevWeek;
      const percentChange = prevWeek > 0 ? ((diff / prevWeek) * 100).toFixed(1) : '0';
      trend = {
        value: diff,
        percent: percentChange,
        isPositive: diff >= 0,
      };
    }

    return {
      avgPerDay,
      peakDay,
      peakWeek,
      trend,
    };
  };

  const metrics = calculateMetrics();

  // Loading skeleton
  if (isLoading && !data) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="h-4 w-24 bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-40 bg-gray-800 rounded mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error && !data) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center">
          <div className="text-red-400 text-xl font-semibold mb-2">Failed to Load Analytics</div>
          <div className="text-red-300 text-sm mb-4">{error.message}</div>
          
          {error.details && (
            <details className="text-left mt-4">
              <summary className="text-red-400 text-xs cursor-pointer mb-2">Error Details (Development)</summary>
              <pre className="text-red-300 text-xs bg-gray-950 p-3 rounded overflow-auto max-h-40">
                {error.details}
              </pre>
            </details>
          )}
          
          <button
            onClick={handleRetry}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Retry {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || data.totalUpdates === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          {!isSuperAdmin && (
            <span className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full border border-blue-700">
              Scoped to your data
            </span>
          )}
          {isSuperAdmin && (
            <span className="text-xs bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-700">
              All data (Superadmin)
            </span>
          )}
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">No Analytics Data Available</div>
          <div className="text-gray-500 text-sm">
            {isSuperAdmin 
              ? 'No user updates have been recorded yet.'
              : 'No updates have been recorded for your CSV records yet.'}
          </div>
        </div>
      </div>
    );
  }

  // Chart colors
  const chartColors = {
    primary: '#ffd700',
    secondary: '#fbbf24',
    accent: '#f59e0b',
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: ChartTooltipPayload[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-accent font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Empty chart component
  const EmptyChart = ({ message }: { message: string }) => (
    <div className="h-64 flex items-center justify-center bg-gray-800/30 border border-gray-700 rounded-lg">
      <div className="text-gray-500 text-center">
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1">Analytics Dashboard</h2>
          {lastRefresh && (
            <div className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!isSuperAdmin && (
            <span className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded-full border border-blue-700">
              Scoped to your data
            </span>
          )}
          {isSuperAdmin && (
            <span className="text-xs bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full border border-green-700">
              All data (Superadmin)
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-lg p-5 hover:border-accent/50 transition-colors">
          <div className="text-gray-400 text-sm mb-2 font-medium">Total Updates</div>
          <div className="text-3xl font-bold text-accent">{data.totalUpdates.toLocaleString()}</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-lg p-5 hover:border-accent/50 transition-colors">
          <div className="text-gray-400 text-sm mb-2 font-medium">Success Rate</div>
          <div className="text-3xl font-bold text-accent">{data.successRate.toFixed(1)}%</div>
        </div>
        
        {metrics && (
          <>
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-lg p-5 hover:border-accent/50 transition-colors">
              <div className="text-gray-400 text-sm mb-2 font-medium">Avg. Per Day</div>
              <div className="text-3xl font-bold text-accent">{metrics.avgPerDay}</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-lg p-5 hover:border-accent/50 transition-colors">
              <div className="text-gray-400 text-sm mb-2 font-medium">This Week</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-accent">
                  {data.updatesPerWeek[data.updatesPerWeek.length - 1]?.count || 0}
                </div>
                {metrics.trend && (
                  <div className={`text-sm font-semibold ${metrics.trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.trend.isPositive ? '↑' : '↓'} {Math.abs(parseFloat(metrics.trend.percent))}%
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Additional Stats */}
      {metrics && (metrics.peakDay || metrics.peakWeek) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {metrics.peakDay && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Peak Day</div>
              <div className="text-lg font-semibold text-white">{metrics.peakDay.date}</div>
              <div className="text-2xl font-bold text-accent">{metrics.peakDay.count} updates</div>
            </div>
          )}
          {metrics.peakWeek && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Peak Week</div>
              <div className="text-lg font-semibold text-white">{metrics.peakWeek.week}</div>
              <div className="text-2xl font-bold text-accent">{metrics.peakWeek.count} updates</div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="space-y-8">
        {/* Daily Updates */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Updates Per Day</h3>
          {data.updatesPerDay.length === 0 ? (
            <EmptyChart message="No daily update data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.updatesPerDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Updates"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Updates */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Updates Per Week</h3>
          {data.updatesPerWeek.length === 0 ? (
            <EmptyChart message="No weekly update data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.updatesPerWeek} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis 
                  dataKey="week" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Bar dataKey="count" name="Updates" radius={[8, 8, 0, 0]}>
                  {data.updatesPerWeek.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === data.updatesPerWeek.length - 1 ? chartColors.primary : chartColors.secondary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Activity Timeline</h3>
          {data.activityTimeline.length === 0 ? (
            <EmptyChart message="No activity timeline data available" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.activityTimeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#9ca3af' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={chartColors.accent}
                  strokeWidth={3}
                  dot={{ fill: chartColors.accent, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Activity"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
