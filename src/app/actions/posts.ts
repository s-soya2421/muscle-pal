"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const content = String(formData.get("content") || "").trim();
  const image_url = (formData.get("image_url") as string) || null;

  if (!content) return;

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error(authError);
  }
  if (!user) {
    // クライアント側でUX的に弾くが、サーバでも最終防衛
    throw new Error("ログインが必要です");
  }

  const { error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, content, image_url });

  if (error) {
    console.error(error);
    throw new Error("投稿に失敗しました");
  }

  // /posts のRSC結果を再検証
  revalidatePath("/posts");
}
