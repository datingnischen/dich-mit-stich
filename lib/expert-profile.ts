import { cache } from "react";
import { getAuthorProfile } from "@/lib/author-profiles";

export type ExpertProfile = NonNullable<Awaited<ReturnType<typeof getAuthorProfile>>>;

export const getDatingExpertProfile = cache(async (): Promise<ExpertProfile | null> => {
  return getAuthorProfile("redaktion");
});
