import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import {
  getMe, getSessionHistory, getMyBadges, getMySkills,
  getOpportunityStats, getLeaderboardPoints, getMyRanks, getCurrentChallenge,
  getMaterialCount, getMyApplications, getRoadmaps,
} from '@/lib/api';
import type { LearningSession, Badge, Skill, OpportunityStats, LeaderboardEntry, MyRanks, WeeklyChallenge, Roadmap } from '@/types';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    redirect('/auth/login');
  }

  if ((session as any).error === 'RefreshTokenError') {
    redirect('/auth/login');
  }

  const token = (session as any).accessToken as string;

  try {
    const userData = await getMe(token);

    const [sessions, badges, skills, oppStats, topPlayers, myRanks, challenge, materialCount, myApplications, roadmaps] = await Promise.all([
      getSessionHistory(token),
      getMyBadges(token),
      getMySkills(token),
      getOpportunityStats(token).catch(() => ({ matched_count: 0, saved_count: 0 })),
      getLeaderboardPoints(token).catch(() => []),
      getMyRanks(token).catch(() => null),
      getCurrentChallenge(token).catch(() => null),
      getMaterialCount(token).catch(() => 0),
      getMyApplications(token).catch(() => []),
      getRoadmaps(token, userData.id).catch(() => []),
    ]);

    // Compute roadmap completion %
    const allRoadmaps = roadmaps as Roadmap[];
    const totalSteps = allRoadmaps.reduce((sum, r) => sum + (r.steps?.length ?? 0), 0);
    const completedSteps = allRoadmaps.reduce((sum, r) => sum + (r.steps?.filter((s: any) => s.verified || (r.completed_steps ?? []).includes(s.order))?.length ?? 0), 0);
    const roadmapPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return (
      <DashboardClient
        user={userData}
        sessions={sessions as LearningSession[]}
        badges={badges as Badge[]}
        skills={skills as Skill[]}
        token={token}
        opportunityStats={oppStats as OpportunityStats}
        topPlayers={(topPlayers as LeaderboardEntry[]).slice(0, 5)}
        myRanks={myRanks as MyRanks | null}
        weeklyChallenge={challenge as WeeklyChallenge | null}
        materialCount={materialCount as number}
        applicationCount={(myApplications as any[]).length}
        roadmapPct={roadmapPct}
      />
    );
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') {
      redirect('/auth/login');
    }
    throw error;
  }
}
