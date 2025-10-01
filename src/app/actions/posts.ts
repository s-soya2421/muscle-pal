"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadPostImages } from "@/lib/post-images-server";
import type { Json } from "@/types/supabase";

export interface CreatePostData {
  content: string;
  privacy: "public" | "followers" | "private";
  post_type: "workout" | "progress" | "motivation" | "general";
  tags?: string[];
  location?: string;
  workout_data?: Json;
  // Note: images are now managed through post_images table
}

export async function createPost(data: CreatePostData | FormData) {
  let content: string;
  let privacy: "public" | "followers" | "private";
  let post_type: "workout" | "progress" | "motivation" | "general";
  let tags: string[] = [];
  let location: string | undefined;
  let workout_data: Json | undefined = {} as Json;
  const imageFiles: File[] = [];

  // FormData か通常のオブジェクトかを判定
  if (data instanceof FormData) {
    content = String(data.get("content") || "").trim();
    privacy = String(data.get("privacy") || "public") as "public" | "followers" | "private";
    post_type = "general"; // FormDataの場合はデフォルト
    
    // FormDataから画像ファイルを収集
    for (let i = 0; i < 4; i++) {
      const file = data.get(`image_${i}`) as File;
      if (file && file.size > 0) {
        imageFiles.push(file);
      }
    }
  } else {
    ({ content, privacy, post_type, tags = [], location, workout_data = {} } = data);
  }

  if (!content?.trim()) {
    throw new Error("投稿内容は必須です");
  }

  if (content.length > 1000) {
    throw new Error("投稿内容は1000文字以内で入力してください");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("認証エラー:", authError);
    throw new Error("認証に失敗しました");
  }
  
  if (!user) {
    throw new Error("ログインが必要です");
  }


  const { data: postData, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: content.trim(),
      privacy,
      post_type,
      tags,
      location: location || null,
      workout_data: workout_data ?? ({} as Json),
    })
    .select()
    .single();

  if (error) {
    console.error("投稿エラー:", error);
    throw new Error("投稿に失敗しました");
  }

  // 投稿作成後、画像をアップロード
  if (imageFiles.length > 0) {
    try {
      await uploadPostImages(imageFiles, postData.id, user.id);
    } catch (uploadError) {
      console.error('画像アップロードエラー:', uploadError);
      // 投稿は作成されたが画像アップロードに失敗した場合の処理
      // エラーをスローするか、警告として扱うかは要件次第
      throw new Error(`投稿は作成されましたが、画像のアップロードに失敗しました: ${uploadError}`);
    }
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
}

export async function togglePostLike(postId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("認証エラー:", authError);
    throw new Error("認証に失敗しました");
  }
  
  if (!user) {
    throw new Error("ログインが必要です");
  }

  // Supabaseのtoggle_post_like関数を呼び出し
  const { data, error } = await supabase.rpc('toggle_post_like', {
    p_post_id: postId
  });

  if (error) {
    console.error("いいねエラー:", error);
    throw new Error("いいねに失敗しました");
  }

  // いいね数を更新（楽観的更新のため）
  const { error: updateError } = await supabase.rpc('update_post_like_count', {
    p_post_id: postId
  });

  if (updateError) {
    console.log("いいね数更新警告:", updateError);
    // エラーでもいいね操作は成功しているので続行
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  
  return data; // true: いいね追加, false: いいね取り消し
}

export async function getPostLikeStatus(postId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  return !error && data;
}

export async function getPosts(options?: {
  userId?: string;
  limit?: number;
  offset?: number;
  post_type?: string;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  let query = supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (
        username,
        display_name,
        avatar_url,
        fitness_level
      ),
      post_images (
        id,
        storage_path,
        display_order,
        alt_text
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.userId) {
    query = query.eq("author_id", options.userId);
  }

  if (options?.post_type) {
    query = query.eq("post_type", options.post_type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("投稿取得エラー:", error);
    throw new Error("投稿の取得に失敗しました");
  }

  // 各投稿のいいね状況を取得（like_count, comment_countはDBカラムを使用）
  const basePosts = data ?? [];
  const postsWithLikeStatus = await Promise.all(
    basePosts.map(async (postItem) => {
      const { data: likeData } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postItem.id)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      return {
        ...postItem,
        is_liked: !!likeData,
      } as (typeof basePosts)[number] & { is_liked: boolean };
    })
  );

  return postsWithLikeStatus;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("プロフィール取得エラー:", error);
    throw new Error("プロフィールの取得に失敗しました");
  }

  return data;
}

export async function getPostById(postId: string) {
  const supabase = (await createClient()) as any;
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  // 投稿の詳細を取得
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (
        username,
        display_name,
        avatar_url,
        fitness_level
      ),
      post_images (
        id,
        storage_path,
        display_order,
        alt_text
      )
    `)
    .eq("id", postId)
    .is("deleted_at", null)
    .single();

  if (postError || !postData) {
    throw new Error("投稿が見つかりません");
  }

  // いいね数を取得
  const { data: likeCountData } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .is("deleted_at", null);

  // ユーザーのいいね状況を取得
  const { data: likeData } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  // コメント数を取得
  const { data: commentCountData } = await supabase
    .from("post_comments")
    .select("id")
    .eq("post_id", postId)
    .is("deleted_at", null);

  return {
    ...postData,
    like_count: likeCountData?.length || 0,
    is_liked: !!likeData,
    comment_count: commentCountData?.length || 0,
  };
}

export async function getPostComments(postId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  // トップレベルコメントを取得
  const { data: commentsData, error } = await supabase
    .from("post_comments")
    .select(`
      *,
      profiles:author_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("post_id", postId)
    .is("parent_comment_id", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("コメント取得エラー:", error);
    throw new Error("コメントの取得に失敗しました");
  }

  // 各コメントのいいね数を取得
  const commentsWithLikes = await Promise.all(
    (commentsData || []).map(async (comment) => {
      const { data: likeCountData } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", comment.id)
        .is("deleted_at", null);

      return {
        ...comment,
        likes: likeCountData?.length || 0,
      };
    })
  );

  return commentsWithLikes;
}

export async function createComment(postId: string, content: string) {
  if (!content?.trim()) {
    throw new Error("コメント内容は必須です");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("認証に失敗しました");
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      profiles:author_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error("コメント投稿エラー:", error);
    throw new Error("コメントの投稿に失敗しました");
  }

  revalidatePath(`/posts/${postId}`);
  
  return {
    ...data,
    likes: 0, // 新しいコメントはいいね数0
  };
}
