import { NextResponse } from 'next/server';
import { AnalyticsData } from '@/types';
import { getUserUpdates } from '@/lib/storage';
import { formatDate, getWeekStart } from '@/lib/utils';

export async function GET() {
  try {
    const updates = await getUserUpdates();

    // Calculate total updates
    const totalUpdates = updates.length;

    // Group by date
    const dailyMap = new Map<string, number>();
    updates.forEach(update => {
      const date = formatDate(update.submittedAt);
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    // Convert to array and sort
    const updatesPerDay = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by week
    const weeklyMap = new Map<string, number>();
    updates.forEach(update => {
      const week = getWeekStart(update.submittedAt);
      weeklyMap.set(week, (weeklyMap.get(week) || 0) + 1);
    });

    const updatesPerWeek = Array.from(weeklyMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Calculate success rate (assuming all stored updates are successful)
    // In production, you might have a status field
    const successRate = totalUpdates > 0 ? 100 : 0;

    // Activity timeline (same as daily for now, but can be more granular)
    const activityTimeline = updatesPerDay;

    const analyticsData: AnalyticsData = {
      totalUpdates,
      updatesPerDay,
      updatesPerWeek,
      successRate,
      activityTimeline,
    };

    return NextResponse.json(analyticsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching analytics:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return NextResponse.json(
      { 
        message: 'Failed to fetch analytics',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

