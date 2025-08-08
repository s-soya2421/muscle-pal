import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Users, Trophy, Target, Play, Heart, ChevronRight } from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata = {
  title: 'MusclePal - フィットネスでつながる世界',
  description:
    'トレーニング仲間と出会い、目標を共有し、一緒に成長しよう。フィットネス愛好者のための総合ソーシャルネットワーク。',
  keywords: ['フィットネス', 'トレーニング', 'ソーシャルネットワーク', 'チャレンジ', '運動'],
  openGraph: {
    title: 'MusclePal - フィットネスでつながる世界',
    description: 'トレーニング仲間と出会い、目標を共有し、一緒に成長しよう',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MusclePal</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button asChild>
                <Link href="/register">登録</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              フィットネスで
              <br />
              つながる世界
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              トレーニング仲間と出会い、目標を共有し、一緒に成長しよう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                asChild
              >
                <Link href="/register">
                  <Play className="h-5 w-5 mr-2" />
                  今すぐ始める
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                asChild
              >
                <Link href="/login">既存アカウントでログイン</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              フィットネスライフを変える機能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              一人では続かないトレーニングも、仲間がいれば楽しく続けられます
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">ソーシャルネットワーク</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  フィットネス愛好者とつながり、進捗を共有して励まし合いましょう
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader className="text-center">
                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">トレーニングセッション</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  一緒にトレーニングする仲間を見つけて、モチベーションを維持
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 transition-colors">
              <CardHeader className="text-center">
                <div className="p-4 bg-orange-100 rounded-full w-16 h-16 mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">チャレンジ</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">友達と競い合って、楽しみながら目標を達成しましょう</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">私たちのビジョン</h2>
            <p className="text-xl text-gray-600">
              フィットネスを通じて、より良いコミュニティを創造します
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">🤝</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">つながり</div>
              <div className="text-gray-600">
                フィットネス愛好者同士の
                <br />
                真のつながりを創造
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">💪</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">成長</div>
              <div className="text-gray-600">
                一人では難しい目標も
                <br />
                仲間と一緒に達成
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">🎯</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">継続</div>
              <div className="text-gray-600">
                楽しみながら続けられる
                <br />
                フィットネス習慣の構築
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">MusclePalの特徴</h2>
            <p className="text-xl text-gray-600">フィットネス習慣を変える、3つの特別な体験</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  モチベーション維持
                </h3>
                <p className="text-gray-600 text-center">
                  一人では続かないトレーニングも、仲間がいれば楽しく継続できます。お互いを励まし合う環境を提供します。
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  目標達成支援
                </h3>
                <p className="text-gray-600 text-center">
                  チャレンジ機能と進捗共有で、効率的に目標達成へ導きます。競い合いながら楽しく成長できます。
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  コミュニティ形成
                </h3>
                <p className="text-gray-600 text-center">
                  トレーニングセッションで新しい仲間と出会い、長期的なフィットネス仲間を見つけることができます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            今すぐ始めて、理想の体を手に入れよう
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            無料でアカウントを作成して、フィットネスコミュニティに参加しましょう
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
            <Link href="/register">
              無料で始める
              <ChevronRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 text-center md:text-left">
            <div className="md:flex-shrink-0">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">MusclePal</span>
              </div>
              <p className="text-gray-400 max-w-xs">
                フィットネスで人生を変える。一緒に頑張りましょう。
              </p>
            </div>
            <div className="md:flex-shrink-0">
              <h4 className="font-semibold mb-4">機能</h4>
              <ul className="space-y-2 text-gray-400">
                <li>ソーシャルネットワーク</li>
                <li>トレーニングセッション</li>
                <li>チャレンジ</li>
                <li>進捗追跡</li>
              </ul>
            </div>
            <div className="md:flex-shrink-0">
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-gray-400">
                <li>ヘルプセンター</li>
                <li>お問い合わせ</li>
                <li>利用規約</li>
                <li>プライバシーポリシー</li>
              </ul>
            </div>
            <div className="md:flex-shrink-0">
              <h4 className="font-semibold mb-4">SNS</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>Instagram</li>
                <li>Facebook</li>
                <li>YouTube</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MusclePal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
