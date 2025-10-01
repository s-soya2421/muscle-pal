"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ChallengeService } from "@/lib/challenge-service";

export async function joinChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "ログインが必要です" } as const;

  const service = new ChallengeService();
  const ok = await service.joinChallenge(user.id, challengeId);
  revalidatePath(`/challenges/${challengeId}`);
  return { ok } as const;
}

export async function pauseChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false } as const;
  const service = new ChallengeService();
  const ok = await service.pauseChallenge(user.id, challengeId);
  revalidatePath(`/challenges/${challengeId}`);
  return { ok } as const;
}

export async function resumeChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false } as const;
  const service = new ChallengeService();
  const ok = await service.resumeChallenge(user.id, challengeId);
  revalidatePath(`/challenges/${challengeId}`);
  return { ok } as const;
}

export async function leaveChallenge(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false } as const;
  const service = new ChallengeService();
  const ok = await service.leaveChallenge(user.id, challengeId);
  revalidatePath(`/challenges/${challengeId}`);
  return { ok } as const;
}

export async function checkInChallenge(
  challengeId: string,
  dayNumber: number,
  performanceData?: { duration?: string; reps?: number; distance?: string },
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false } as const;
  const service = new ChallengeService();
  const ok = await service.performCheckIn(user.id, challengeId, dayNumber, performanceData, notes);
  revalidatePath(`/challenges/${challengeId}`);
  return { ok } as const;
}
