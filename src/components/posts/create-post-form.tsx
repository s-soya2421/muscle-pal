'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Send, X } from 'lucide-react';
import Link from 'next/link';

interface CreatePostFormProps {
  userId?: string;
}

const POST_TYPES = [
  { value: 'workout', label: 'ワークアウト', color: 'bg-green-100 text-green-800' },
  { value: 'progress', label: '進歩報告', color: 'bg-blue-100 text-blue-800' },
  { value: 'motivation', label: 'モチベーション', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'general', label: '一般', color: 'bg-gray-100 text-gray-800' },
];

const COMMON_TAGS = [
  '筋トレ', 'カーディオ', 'ヨガ', 'ランニング', '水泳', 'ダイエット', 
  '増量', 'プロテイン', 'ジム', 'ホームワークアウト', '新記録', 
  'モチベーション', '継続', '目標達成'
];

export function CreatePostForm({ userId }: CreatePostFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    privacy: 'public' as 'public' | 'followers' | 'private',
    post_type: 'general' as 'workout' | 'progress' | 'motivation' | 'general',
    tags: [] as string[],
    location: '',
    workout_data: {
      exercises: [] as Array<{
        name: string;
        sets?: number;
        reps?: number;
        weight?: number;
        duration?: string;
      }>
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.content.trim()) {
      newErrors.content = '投稿内容は必須です';
    } else if (formData.content.length > 1000) {
      newErrors.content = '投稿内容は1000文字以下で入力してください';
    }

    if (formData.tags.length > 10) {
      newErrors.tags = 'タグは10個まで選択できます';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const { createPost } = await import('@/app/actions/posts');
      
      await createPost({
        content: formData.content.trim(),
        privacy: formData.privacy,
        post_type: formData.post_type,
        tags: formData.tags,
        location: formData.location || undefined,
        workout_data: formData.post_type === 'workout' ? formData.workout_data : undefined,
      });

      router.push('/posts');
      router.refresh();
    } catch (error) {
      console.error('投稿作成エラー:', error);
      setErrors({ general: error instanceof Error ? error.message : '投稿の作成に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const addExercise = () => {
    setFormData({
      ...formData,
      workout_data: {
        ...formData.workout_data,
        exercises: [...formData.workout_data.exercises, { name: '' }]
      }
    });
  };

  const updateExercise = (index: number, field: string, value: string | number) => {
    const updatedExercises = [...formData.workout_data.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setFormData({
      ...formData,
      workout_data: {
        ...formData.workout_data,
        exercises: updatedExercises
      }
    });
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      workout_data: {
        ...formData.workout_data,
        exercises: formData.workout_data.exercises.filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          ダッシュボードに戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" data-user-id={userId ?? undefined}>
        {/* 投稿タイプ */}
        <Card>
          <CardHeader>
            <CardTitle>投稿タイプ</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.post_type}
              onChange={(e) => setFormData({ ...formData, post_type: e.target.value as typeof formData.post_type })}
            >
              {POST_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* 投稿内容 */}
        <Card>
          <CardHeader>
            <CardTitle>投稿内容 *</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="今日のトレーニングはどうでしたか？達成したことや感じたことを書いてください..."
              rows={6}
              className={`resize-none ${errors.content ? 'border-red-500' : ''}`}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.content && (
                <p className="text-red-500 text-sm">{errors.content}</p>
              )}
              <p className="text-gray-500 text-sm ml-auto">
                {formData.content.length}/1000文字
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ワークアウトデータ（ワークアウト投稿の場合） */}
        {formData.post_type === 'workout' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ワークアウト詳細
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExercise}
                >
                  種目追加
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.workout_data.exercises.map((exercise, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>種目 {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="種目名"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="セット数"
                      value={exercise.sets || ''}
                      onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="回数"
                      value={exercise.reps || ''}
                      onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="重量 (kg)"
                      value={exercise.weight || ''}
                      onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* タグ */}
        <Card>
          <CardHeader>
            <CardTitle>タグ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  disabled={formData.tags.includes(tag) || formData.tags.length >= 10}
                  className="text-xs"
                >
                  #{tag}
                </Button>
              ))}
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {errors.tags && (
              <p className="text-red-500 text-sm">{errors.tags}</p>
            )}
          </CardContent>
        </Card>

        {/* その他の設定 */}
        <Card>
          <CardHeader>
            <CardTitle>その他の設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">場所（オプション）</Label>
              <input
                id="location"
                type="text"
                placeholder="例: 渋谷のジム"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1"
              />
            </div>

            <div>
              <Label htmlFor="privacy">公開設定</Label>
              <Select
                id="privacy"
                value={formData.privacy}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value as typeof formData.privacy })}
              >
                <option value="public">公開（全員が見れます）</option>
                <option value="followers">フォロワーのみ</option>
                <option value="private">非公開（自分のみ）</option>
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
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={submitting || !formData.content.trim()}>
            {submitting && <Spinner className="w-4 h-4 mr-2" />}
            <Send className="w-4 h-4 mr-2" />
            投稿する
          </Button>
        </div>
      </form>
    </div>
  );
}
