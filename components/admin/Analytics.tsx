'use client';

import { useMemo } from 'react';

interface AnalyticsProps {
    data: any[];
}

export default function Analytics({ data }: AnalyticsProps) {
    const stats = useMemo(() => {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        return {
            total: data.length,
            today: data.filter(item => item.submittedAt >= now - dayMs).length,
            thisWeek: data.filter(item => item.submittedAt >= now - (7 * dayMs)).length,
            thisMonth: data.filter(item => item.submittedAt >= now - (30 * dayMs)).length,
            avgPerDay: data.length > 0
                ? Math.round((data.length / Math.max(1, (now - Math.min(...data.map((d: any) => d.submittedAt))) / dayMs)) * 10) / 10
                : 0,
        };
    }, [data]);

    const hourlyDistribution = useMemo(() => {
        const hours = new Array(24).fill(0);
        data.forEach(item => {
            const hour = new Date(item.submittedAt).getHours();
            hours[hour]++;
        });
        return hours;
    }, [data]);

    const peakHour = useMemo(() => {
        const maxCount = Math.max(...hourlyDistribution);
        const hour = hourlyDistribution.indexOf(maxCount);
        return { hour, count: maxCount };
    }, [hourlyDistribution]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Submissions</div>
                    <div className="text-3xl font-bold text-accent">{stats.total}</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Today</div>
                    <div className="text-3xl font-bold text-green-400">{stats.today}</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">This Week</div>
                    <div className="text-3xl font-bold text-blue-400">{stats.thisWeek}</div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">This Month</div>
                    <div className="text-3xl font-bold text-purple-400">{stats.thisMonth}</div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Activity Metrics</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Average per day:</span>
                            <span className="text-white font-semibold">{stats.avgPerDay}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Peak hour:</span>
                            <span className="text-white font-semibold">
                                {peakHour.hour}:00 ({peakHour.count} submissions)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Hourly Distribution</h3>
                    <div className="flex items-end gap-1 h-24">
                        {hourlyDistribution.map((count, hour) => {
                            const maxCount = Math.max(...hourlyDistribution);
                            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            return (
                                <div
                                    key={hour}
                                    className="flex-1 bg-accent rounded-t"
                                    style={{ height: `${height}%`, minHeight: count > 0 ? '2px' : '0' }}
                                    title={`${hour}:00 - ${count} submissions`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0:00</span>
                        <span>12:00</span>
                        <span>23:00</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
