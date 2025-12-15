import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsData } from '@/types';
import { getUserUpdates, getCSVData, getAdminUsers } from '@/lib/storage';
import { formatDate, getWeekStart, normalizeTelegramAccount } from '@/lib/utils';
import { requireAdminAuth } from '@/lib/auth';
import { handleApiError, createValidationError, createCacheHeaders } from '@/lib/apiHelpers';

// Force dynamic rendering to support admin-specific filtering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication and get admin email
    const authCheck = await requireAdminAuth(request);
    if (authCheck.error) {
      return authCheck.response;
    }

    const adminEmail = request.headers.get('x-user-email');
    if (!adminEmail) {
      return createValidationError('Admin email not provided');
    }

    // Get all user updates
    let updates = await getUserUpdates();

    // Check if admin is superadmin
    const admins = await getAdminUsers();
    const currentAdmin = admins.find(
      admin => admin.email.toLowerCase() === adminEmail.toLowerCase()
    );
    const isSuperAdmin = currentAdmin?.role === 'superadmin';

    // If not superadmin, filter updates to only those matching their CSV records
    if (!isSuperAdmin) {
      const adminCSVData = await getCSVData(false, adminEmail);
      const adminTelegramAccounts = new Set(adminCSVData.keys());

      // Filter updates to only include those matching admin's CSV records
      updates = updates.filter(update => {
        const normalizedAccount = normalizeTelegramAccount(update.telegramAccount);
        return adminTelegramAccounts.has(normalizedAccount);
      });
    }

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
      headers: createCacheHeaders(),
    });
  } catch (error) {
    return handleApiError(error, 500, 'Failed to fetch analytics');
  }
}

