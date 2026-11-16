import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://df-script.js.org";
const DOCS_JSON_PATH = path.resolve(__dirname, "../public/docs.json");
const SITEMAP_PATH = path.resolve(__dirname, "../public/sitemap.xml");

function getQualifiedPath(op) {
  const cat = op.category || "";
  let name = op.propertyAccess || op.name || "";
  if (cat === "ColumnExpression" && op.accessor) {
    name = `${op.accessor}.${name}`;
  }
  return `${cat}/${name}`;
}

function generateSitemap() {
  const staticRoutes = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/about", priority: "0.8", changefreq: "monthly" },
    { loc: "/notebook", priority: "0.8", changefreq: "weekly" },
    { loc: "/llm", priority: "0.8", changefreq: "monthly" },
    { loc: "/support", priority: "0.5", changefreq: "monthly" },
    { loc: "/llms.txt", priority: "0.9", changefreq: "weekly" },
    { loc: "/llms-full.txt", priority: "0.9", changefreq: "weekly" },
    { loc: "/docs.json", priority: "0.8", changefreq: "weekly" },
  ];

  const opRoutes = [];

  if (fs.existsSync(DOCS_JSON_PATH)) {
    try {
      const raw = fs.readFileSync(DOCS_JSON_PATH, "utf-8");
      const data = JSON.parse(raw);

      function traverse(obj) {
        if (!obj || typeof obj !== "object") return;
        if (obj.category && (obj.propertyAccess || obj.name)) {
          const qualified = getQualifiedPath(obj);
          opRoutes.push({
            loc: `/docs/latest/${qualified}`,
            priority: "0.7",
            changefreq: "weekly",
          });
          return;
        }
        for (const key of Object.keys(obj)) {
          traverse(obj[key]);
        }
      }

      traverse(data);
    } catch (err) {
      console.warn("Could not read docs.json for sitemap:", err);
    }
  }

  const allRoutes = [...staticRoutes, ...opRoutes];
  const lastmod = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>${BASE_URL}${r.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, xml.trim() + "\n", "utf-8");
  console.log(`Generated sitemap.xml with ${allRoutes.length} URLs at ${SITEMAP_PATH}`);
}

generateSitemap();
