'use client';

import { useState, useOptimistic, useTransition, useEffect } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { createComment } from '@/app/actions/posts';
import { createClient } from '@/lib/supabase/client';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  likes: number;
}

interface ReplySectionProps {
  postId: string;
  replies: Reply[];
}

export function ReplySection({ postId, replies }: ReplySectionProps) {
  const [newReply, setNewReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null>(null);
  const supabase = createClient();
  
  // 現在のユーザー情報を取得
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    };
    getUser();
  }, [supabase]);
  
  // 楽観的更新用
  const [optimisticReplies, addOptimisticReply] = useOptimistic(
    replies,
    (state, action: { type: 'add' | 'remove'; reply: Reply }) => {
      if (action.type === 'add') {
        return [...state, action.reply];
      } else if (action.type === 'remove') {
        return state.filter(r => r.id !== action.reply.id);
      }
      return state;
    }
  );

  const handleSubmitReply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newReply.trim() || isPending) return;

    setError(null);
    const content = newReply.trim();
    
    const optimisticReply: Reply = {
      id: 'temp-' + Date.now(),
      content,
      created_at: new Date().toISOString(),
      profiles: currentUser ? {
        username: currentUser.username || '',
        display_name: currentUser.display_name || currentUser.username || '',
        avatar_url: currentUser.avatar_url,
      } : {
        username: 'あなた',
        display_name: 'あなた',
      },
      likes: 0,
    };
    
    // ★ 楽観更新は transition の中で
    startTransition(() => {
      addOptimisticReply({ type: 'add', reply: optimisticReply });
      setNewReply('');
    });

    // ネットワーク処理は外で実行
    void createComment(postId, content)
      .then(() => {
        // 成功時はrevalidateで自動更新される
      })
      .catch((err) => {
        console.error('コメントの投稿に失敗しました:', err);
        // 失敗時はロールバック
        startTransition(() => {
          addOptimisticReply({ type: 'remove', reply: optimisticReply });
        });
        setError('コメントの投稿に失敗しました。もう一度お試しください。');
      });
  };

  return (
    <div data-testid="reply-section" className="space-y-4">
      {/* Reply Form */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">返信を投稿</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitReply} className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                {currentUser?.avatar_url && (
                  <AvatarImage src={currentUser.avatar_url} alt={currentUser.display_name || currentUser.username} />
                )}
                <AvatarFallback>
                  {currentUser ? (
                    (currentUser.display_name || currentUser.username || 'U').charAt(0).toUpperCase()
                  ) : 'あ'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="この投稿に返信..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newReply.trim() || isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isPending ? '投稿中...' : '返信する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Replies List */}
      {replies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold">
              返信 ({optimisticReplies.length})
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {optimisticReplies.map((reply, index) => (
              <div key={reply.id}>
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    {reply.profiles?.avatar_url && <AvatarImage src={reply.profiles.avatar_url} alt={reply.profiles?.display_name || ''} />}
                    <AvatarFallback>
                      {(reply.profiles?.display_name || reply.profiles?.username || 'U').split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {reply.profiles?.display_name || reply.profiles?.username || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.created_at).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        {reply.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 h-7 px-2"
                      >
                        <Heart className="w-3 h-3" />
                        <span>{reply.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-500 h-7 px-2"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>返信</span>
                      </Button>
                    </div>
                  </div>
                </div>
                {index < replies.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {optimisticReplies.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>まだ返信がありません</p>
            <p className="text-sm">最初の返信を投稿してみましょう！</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}