"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const content = String(formData.get("content") || "").trim();
  const privacy = String(formData.get("privacy") || "public") as "public" | "followers" | "private";

  if (!content) {
    throw new Error("投稿内容は必須です");
  }

  if (content.length > 500) {
    throw new Error("投稿内容は500文字以内で入力してください");
  }

  const supabase = await createServerClient();
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

  // 必要最小限のフィールドのみでpostsテーブルに挿入
  const { error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      privacy
    });

  if (error) {
    console.error("投稿エラー:", error);
    throw new Error("投稿に失敗しました");
  }

  // /posts と /dashboard のRSC結果を再検証
  revalidatePath("/posts");
  revalidatePath("/dashboard");
}
