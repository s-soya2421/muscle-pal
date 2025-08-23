export type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string; // ISO string
  author?: string | null;
};
