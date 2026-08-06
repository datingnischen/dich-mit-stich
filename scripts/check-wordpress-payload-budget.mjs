const API_BASE = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";
const MIB = 1024 * 1024;

const cityMediaIndexResponse = await fetch(
  `${API_BASE}/stadt?per_page=100&_fields=featured_media`,
  { headers: { "User-Agent": "Dich-mit-Stich WordPress payload budget check" } },
);
if (!cityMediaIndexResponse.ok) {
  throw new Error(`city media index: WordPress returned ${cityMediaIndexResponse.status}`);
}
const cityMediaIds = (await cityMediaIndexResponse.json())
  .map((city) => Number(city.featured_media))
  .filter(Boolean)
  .join(",");

const checks = [
  {
    name: "post routes",
    path: "/posts?per_page=100&_fields=id,slug,type,date,modified",
    maxBytes: 64 * 1024,
  },
  {
    name: "page routes",
    path: "/pages?per_page=100&_fields=id,slug,type,date,modified",
    maxBytes: 64 * 1024,
  },
  {
    name: "post list",
    path: "/posts?per_page=25&_embed=1&_fields=id,slug,type,date,modified,link,title,excerpt,_links,_embedded",
    maxBytes: MIB,
  },
  {
    name: "page list",
    path: "/pages?per_page=25&_embed=1&_fields=id,slug,type,date,modified,link,title,excerpt,_links,_embedded",
    maxBytes: MIB,
  },
  {
    name: "city routes",
    path: "/stadt?per_page=100&_fields=id,slug,acf",
    maxBytes: 256 * 1024,
  },
  {
    name: "city list",
    path: "/stadt?per_page=100&_fields=id,slug,featured_media,acf.city_id,acf.city_name,acf.city_country",
    maxBytes: 64 * 1024,
  },
  {
    name: "city list media",
    path: `/media?include=${cityMediaIds}&per_page=100&_fields=id,source_url,alt_text`,
    maxBytes: 128 * 1024,
  },
  {
    name: "city detail",
    path: "/stadt?slug=de-berlin&_embed=wp:featuredmedia&_fields=id,slug,title,excerpt,content,featured_media,acf,_links,_embedded",
    maxBytes: 256 * 1024,
  },
];

let failed = false;

for (const check of checks) {
  const response = await fetch(`${API_BASE}${check.path}`, {
    headers: { "User-Agent": "Dich-mit-Stich WordPress payload budget check" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`${check.name}: WordPress returned ${response.status} ${response.statusText}`);
  }

  const bytes = (await response.arrayBuffer()).byteLength;
  const ratio = bytes / check.maxBytes;
  const status = bytes <= check.maxBytes ? "PASS" : "FAIL";
  console.log(
    `${status} ${check.name}: ${(bytes / MIB).toFixed(3)} MiB / ${(check.maxBytes / MIB).toFixed(3)} MiB (${(
      ratio * 100
    ).toFixed(1)}%)`,
  );

  if (bytes > check.maxBytes) failed = true;
}

if (failed) {
  console.error("One or more WordPress responses exceed their cache budget.");
  process.exit(1);
}
