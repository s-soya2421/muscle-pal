"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface CreatePostData {
  content: string;
  privacy: "public" | "followers" | "private";
  post_type: "workout" | "progress" | "motivation" | "general";
  tags?: string[];
  location?: string;
  workout_data?: any;
}

export async function createPost(data: CreatePostData | FormData) {
  let content: string;
  let privacy: "public" | "followers" | "private";
  let post_type: "workout" | "progress" | "motivation" | "general";
  let tags: string[] = [];
  let location: string | undefined;
  let workout_data: any;

  // FormData か通常のオブジェクトかを判定
  if (data instanceof FormData) {
    content = String(data.get("content") || "").trim();
    privacy = String(data.get("privacy") || "public") as "public" | "followers" | "private";
    post_type = "general"; // FormDataの場合はデフォルト
  } else {
    ({ content, privacy, post_type, tags = [], location, workout_data } = data);
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

  const { error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: content.trim(),
      privacy,
      post_type,
      tags,
      location: location || null,
      workout_data: workout_data || {},
    });

  if (error) {
    console.error("投稿エラー:", error);
    throw new Error("投稿に失敗しました");
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
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

  return data || [];
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
