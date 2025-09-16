import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Post } from '@/types/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dumbbell,
  Users,
  Trophy,
  Target,
  Plus,
  Calendar,
  MessageCircle,
  Search,
  MessageSquare,
  Bell,
  Settings,
  User,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { PostCard } from '@/app/posts/_components/post-card';

export const metadata = {
  title: 'ダッシュボード | MusclePal',
  description: 'あなたのフィットネス活動をトラッキングし、コミュニティとつながりましょう。',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // サーバーサイドで認証チェック
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
     // redirect('/login');
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent userId={user?.id || 'mock-user'} />
    </Suspense>
  );
}

// Loading Skeleton Component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MusclePal</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Content Component
async function DashboardContent({ userId }: { userId: string }) {
  // Import server actions and mock data
  const { getPosts, getUserProfile } = await import('@/app/actions/posts');
  const {
    mockStats,
    mockUpcomingSessions,
    mockActiveChallenges,
    mockUserRecommendations,
  } = await import('@/lib/mock-data');

  // 実際のデータを取得
  let userProfile = null;
  let timelinePosts: Post[] = [];
  
  try {
    // ユーザープロフィールを取得
    userProfile = await getUserProfile(userId);
    // 投稿を取得（最新10件）
    timelinePosts = await getPosts({ limit: 10 });
  } catch (error) {
    console.error('データ取得エラー:', error);
    // エラー時はモックデータを使用
    const { getCurrentUser, mockTimelinePosts } = await import('@/lib/mock-data');
    userProfile = getCurrentUser();
    timelinePosts = mockTimelinePosts as unknown as Post[];
  }

  // 現在はモックデータを使用（後で実データに置き換え）
  const stats = mockStats;
  const upcomingSessions = mockUpcomingSessions.slice(0, 2);
  const activeChallenges = mockActiveChallenges.slice(0, 2);
  const userRecommendations = mockUserRecommendations.slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">MusclePal</span>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                  ダッシュボード
                </Link>
                <Link href="/posts" className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors">
                  投稿
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - User Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {userProfile?.display_name || 'ユーザー'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {userProfile?.fitness_level === 'beginner' && '初心者'}
                    {userProfile?.fitness_level === 'intermediate' && '中級者'}  
                    {userProfile?.fitness_level === 'advanced' && '上級者'}
                  </p>
                  <Link href="/profile/edit">
                    <Button size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      プロフィール編集
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  アクティビティ統計
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">投稿数</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.posts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">セッション参加</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.sessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-600">チャレンジ完了</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.challenges}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600">フォロワー</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.followers}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/posts/new" className="w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    新しい投稿
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  セッションを探す
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Trophy className="h-4 w-4 mr-2" />
                  チャレンジに参加
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Message */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  おかえりなさい、{userProfile?.display_name || 'ユーザー'}さん！
                </h2>
                <p className="text-blue-100 mb-4">
                  今日も素晴らしいトレーニングを始めましょう。コミュニティの仲間があなたを応援しています。
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    今日の目標を設定
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    進捗を確認
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Posts */}
            <div className="space-y-6">
              {timelinePosts.length > 0 ? timelinePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              )) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500 mb-4">まだ投稿がありません</p>
                    <Link href="/posts/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        最初の投稿を作成
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar - Activity & Recommendations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-600" />
                  参加予定セッション
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map((session, index) => (
                  <div key={session.id} className={`border-l-4 ${index === 0 ? 'border-green-500' : 'border-blue-500'} pl-4 py-2`}>
                    <h5 className="font-semibold text-sm text-gray-900">{session.title}</h5>
                    <p className="text-xs text-gray-500">{session.date} {session.time}</p>
                    <p className="text-xs text-gray-600">参加者: {session.currentParticipants}名</p>
                    <p className="text-xs text-gray-500">{session.location}</p>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  セッションを探す
                </Button>
              </CardContent>
            </Card>

            {/* Active Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-orange-600" />
                  参加中チャレンジ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id}>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-semibold text-sm text-gray-900">{challenge.title}</h5>
                      <span className="text-xs text-gray-500">{challenge.currentDay}/{challenge.duration}日</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${challenge.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      あと{challenge.duration - challenge.currentDay}日で完了！
                    </p>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  新しいチャレンジ
                </Button>
              </CardContent>
            </Card>

            {/* Suggested Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  おすすめユーザー
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userRecommendations.map((user, index) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${index === 0 ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                      <User className={`h-4 w-4 ${index === 0 ? 'text-blue-600' : 'text-green-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h6 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h6>
                      <p className="text-xs text-gray-500 truncate">{user.level}</p>
                      {user.mutualConnections > 0 && (
                        <p className="text-xs text-gray-400">共通の友達: {user.mutualConnections}名</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      {user.isFollowing ? 'フォロー中' : 'フォロー'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
        <div className="flex justify-around">
          <Button variant="ghost" size="sm" className="flex flex-col items-center px-2">
            <Dumbbell className="h-5 w-5 mb-1 text-blue-600" />
            <span className="text-xs text-blue-600">ダッシュボード</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center px-2">
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs">検索</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center px-2">
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">投稿</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center px-2">
            <Calendar className="h-5 w-5 mb-1" />
            <span className="text-xs">セッション</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center px-2">
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">プロフィール</span>
          </Button>
        </div>
      </div>
    </div>
  );
}