import { Suspense } from 'react';
import { Metadata } from 'next';
import { CreatePostForm } from '@/components/posts/create-post-form';
import { CreatePostSkeleton } from '@/components/posts/create-post-skeleton';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '新しい投稿 - MusclePal',
  description: 'フィットネスの進歩や体験をシェアしましょう',
};

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          新しい投稿
        </h1>
        <p className="text-gray-600">
          あなたのフィットネスの進歩や体験をシェアしましょう！
        </p>
      </div>

      <Suspense fallback={<CreatePostSkeleton />}>
        <CreatePostForm userId={user.id} />
      </Suspense>
    </div>
  );
}