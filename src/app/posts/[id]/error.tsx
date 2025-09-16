'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PostDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('投稿詳細エラー:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/posts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">投稿</h1>
        </div>
      </div>

      {/* Error Content */}
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="mt-4">投稿の読み込みに失敗しました</CardTitle>
            <CardDescription>
              投稿が見つからないか、アクセス権限がない可能性があります。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              {error.message === '投稿が見つかりません' 
                ? '指定された投稿は存在しないか、削除された可能性があります。'
                : 'しばらく時間をおいてから再度お試しください。'
              }
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={reset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                再試行
              </Button>
              <Link href="/posts">
                <Button>
                  投稿一覧に戻る
                </Button>
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  エラー詳細 (開発環境のみ)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                  {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}