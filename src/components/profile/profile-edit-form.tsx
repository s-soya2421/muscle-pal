'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Camera, X } from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  preferred_workout_types: string[];
  location: string | null;
  privacy_settings: {
    profile_visibility: 'public' | 'private';
    activity_visibility: 'public' | 'private';
  };
}

interface ProfileEditFormProps {
  userId: string;
}

const WORKOUT_TYPES = [
  '筋力トレーニング',
  'カーディオ',
  'ヨガ',
  'ランニング',
  '水泳',
  'サイクリング',
  'ピラティス',
  'ダンス',
  'ボクシング',
  'クライミング',
  'テニス',
  'サッカー',
  'バスケットボール',
  'その他'
];

export function ProfileEditForm({ userId }: ProfileEditFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    fitness_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    preferred_workout_types: [] as string[],
    location: '',
    profile_visibility: 'public' as 'public' | 'private',
    activity_visibility: 'public' as 'public' | 'private',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          fitness_level: data.fitness_level || 'beginner',
          preferred_workout_types: data.preferred_workout_types || [],
          location: data.location || '',
          profile_visibility: data.privacy_settings?.profile_visibility || 'public',
          activity_visibility: data.privacy_settings?.activity_visibility || 'public',
        });
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'ユーザーネームは必須です';
    } else if (formData.username.length < 3) {
      newErrors.username = 'ユーザーネームは3文字以上で入力してください';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'ユーザーネームは英数字とアンダースコアのみ使用できます';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = '表示名は必須です';
    } else if (formData.display_name.length > 50) {
      newErrors.display_name = '表示名は50文字以下で入力してください';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = '自己紹介は500文字以下で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio || null,
          fitness_level: formData.fitness_level,
          preferred_workout_types: formData.preferred_workout_types,
          location: formData.location || null,
          privacy_settings: {
            profile_visibility: formData.profile_visibility,
            activity_visibility: formData.activity_visibility,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setErrors({ general: 'プロフィールの更新に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const addWorkoutType = (type: string) => {
    if (!formData.preferred_workout_types.includes(type)) {
      setFormData({
        ...formData,
        preferred_workout_types: [...formData.preferred_workout_types, type],
      });
    }
  };

  const removeWorkoutType = (type: string) => {
    setFormData({
      ...formData,
      preferred_workout_types: formData.preferred_workout_types.filter(t => t !== type),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          ダッシュボードに戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* プロフィール画像 */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール画像</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-lg">
                  {formData.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" disabled>
                <Camera className="w-4 h-4 mr-2" />
                画像を変更（準備中）
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">ユーザーネーム *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="半角英数字とアンダースコア"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <Label htmlFor="display_name">表示名 *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="コミュニティで表示される名前"
                className={errors.display_name ? 'border-red-500' : ''}
              />
              {errors.display_name && (
                <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="あなたについて教えてください（500文字以内）"
                rows={4}
                className={errors.bio ? 'border-red-500' : ''}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                )}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.bio.length}/500文字
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="location">居住地</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="例: 東京都渋谷区"
              />
            </div>
          </CardContent>
        </Card>

        {/* フィットネス情報 */}
        <Card>
          <CardHeader>
            <CardTitle>フィットネス情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fitness_level">フィットネスレベル</Label>
              <Select
                id="fitness_level"
                value={formData.fitness_level}
                onChange={(e) => setFormData({ ...formData, fitness_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
              >
                <option value="beginner">初心者</option>
                <option value="intermediate">中級者</option>
                <option value="advanced">上級者</option>
              </Select>
            </div>

            <div>
              <Label>好きなワークアウト</Label>
              <div className="space-y-3">
                <Select 
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addWorkoutType(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">ワークアウトタイプを選択</option>
                  {WORKOUT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                
                {formData.preferred_workout_types.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferred_workout_types.map((type) => (
                      <Badge key={type} variant="secondary" className="flex items-center gap-1">
                        {type}
                        <button
                          type="button"
                          onClick={() => removeWorkoutType(type)}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* プライバシー設定 */}
        <Card>
          <CardHeader>
            <CardTitle>プライバシー設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profile_visibility">プロフィールの公開設定</Label>
              <Select
                id="profile_visibility"
                value={formData.profile_visibility}
                onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value as 'public' | 'private' })}
              >
                <option value="public">公開</option>
                <option value="private">非公開</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity_visibility">アクティビティの公開設定</Label>
              <Select
                id="activity_visibility"
                value={formData.activity_visibility}
                onChange={(e) => setFormData({ ...formData, activity_visibility: e.target.value as 'public' | 'private' })}
              >
                <option value="public">公開</option>
                <option value="private">非公開</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={saving}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner className="w-4 h-4 mr-2" />}
            保存する
          </Button>
        </div>
      </form>
    </div>
  );
}