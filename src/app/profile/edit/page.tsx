import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { ProfileEditSkeleton } from '@/components/profile/profile-edit-skeleton';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'プロフィール編集 - MusclePal',
  description: 'あなたのプロフィール情報を編集します',
};

export default async function ProfileEditPage() {
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
          プロフィール編集
        </h1>
        <p className="text-gray-600">
          あなたの情報を更新して、コミュニティとのつながりを深めましょう
        </p>
      </div>

      <Suspense fallback={<ProfileEditSkeleton />}>
        <ProfileEditForm userId={user.id} />
      </Suspense>
    </div>
  );
}