const API_BASE = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";
const MIB = 1024 * 1024;

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
