import { SiteSearchPage, siteSearchMetadata, type SearchParams } from "@/components/site-search-page";

export const metadata = siteSearchMetadata("de");

export default function UeberUnsSuchePage({ searchParams }: { searchParams: SearchParams }) {
  return <SiteSearchPage market="de" searchParams={searchParams} />;
}
