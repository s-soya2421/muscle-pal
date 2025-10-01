"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createPost } from "@/app/actions/posts";
import { validateImages, IMAGE_CONFIG } from "@/lib/image-upload-client";

export function CreatePostForm() {
  const supabase = createBrowserClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // best-effort のUX: ログイン状態でボタン制御
  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthed(Boolean(data.user));
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // バリデーション実行
    const validationError = validateImages(files);
    if (validationError) {
      setError(validationError.message);
      // ファイル選択をリセット
      e.target.value = '';
      return;
    }

    setError(null);
    setSelectedImages(files);

    // プレビュー用のURLを生成
    const previews = files.map(file => URL.createObjectURL(file));
    
    // 古いURLをクリーンアップ
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // 削除される画像のURLをクリーンアップ
    URL.revokeObjectURL(imagePreviews[index]);
    
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  async function onAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        // 画像データをFormDataに追加
        selectedImages.forEach((file, index) => {
          formData.append(`image_${index}`, file);
        });
        
        await createPost(formData);
        formRef.current?.reset();
        
        // 画像プレビューをクリア
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setSelectedImages([]);
        setImagePreviews([]);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("投稿に失敗しました");
        }
      }
    });
  }

  return (
    <div className="flex gap-3">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
      
      {/* Form */}
      <form ref={formRef} action={onAction} className="flex-1 space-y-3">
        <Textarea
          id="content"
          name="content"
          placeholder="いまどうしてる？"
          required
          className="min-h-[120px] text-xl placeholder:text-gray-500 border-none resize-none focus:ring-0 p-0"
        />
      
      {/* 画像選択エリア */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label
            htmlFor="image-upload"
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg p-3 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center text-sm text-gray-600"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {`画像を選択 (最大${IMAGE_CONFIG.MAX_COUNT}枚、${IMAGE_CONFIG.MAX_SIZE / (1024 * 1024)}MB以下)`}
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* 画像プレビュー */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`プレビュー ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-blue-500">
            {/* Image icon */}
            <button type="button" className="p-2 hover:bg-blue-50 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Poll icon */}
            <button type="button" className="p-2 hover:bg-blue-50 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            {/* Location icon */}
            <button type="button" className="p-2 hover:bg-blue-50 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {!authed && (
              <div className="text-xs text-red-500">
                投稿するにはログインが必要です
              </div>
            )}
            <Button 
              type="submit" 
              disabled={!authed || isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-full disabled:opacity-50"
            >
              {isPending ? "投稿中…" : "投稿"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-2" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
