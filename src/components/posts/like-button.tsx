'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { togglePostLike } from '@/app/actions/posts';

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialIsLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeButton({ 
  postId, 
  initialLikeCount, 
  initialIsLiked = false,
  size = 'sm' 
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    // 楽観的更新
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    startTransition(async () => {
      try {
        await togglePostLike(postId);
      } catch (error) {
        // エラー時は元に戻す
        setIsLiked(!newIsLiked);
        setLikeCount(likeCount);
        console.error('いいねエラー:', error);
      }
    });
  };

  const buttonSize = size === 'lg' ? 'default' : (size === 'md' ? 'sm' : size);
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <Button
      variant={isLiked ? 'default' : 'ghost'}
      size={buttonSize}
      onClick={handleLike}
      disabled={isPending}
      className={`transition-colors duration-200 ${
        isLiked 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
      }`}
    >
      <Heart 
        className={`${iconSize} mr-1 transition-all duration-200 ${
          isLiked ? 'fill-current' : ''
        }`} 
      />
      <span className={size === 'lg' ? 'text-base' : 'text-sm'}>
        {likeCount}
      </span>
    </Button>
  );
}