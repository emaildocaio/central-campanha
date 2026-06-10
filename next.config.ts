import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Dois modos de build:
//  • Local (sem GITHUB_PAGES): modo servidor normal — `next build && next start`
//    serve na raiz (http://localhost:3000), ótimo para preview/staging local.
//  • GitHub Pages (GITHUB_PAGES=true, setado no workflow de deploy): export
//    estático para `out/`, sob o basePath /central-campanha (site de projeto).
// ---------------------------------------------------------------------------
const ghPages = process.env.GITHUB_PAGES === "true";
const repo = "central-campanha";

const nextConfig: NextConfig = ghPages
  ? {
      output: "export", // gera HTML/CSS/JS estáticos em out/
      basePath: `/${repo}`, // emaildocaio.github.io/central-campanha
      images: { unoptimized: true }, // Pages não tem o otimizador de imagem do Next
      trailingSlash: true, // /rota/ -> /rota/index.html (evita 404 ao recarregar no Pages)
    }
  : {};

export default nextConfig;
