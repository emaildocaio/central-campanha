# Especificação — Base de Bairros (locais de votação × RUACEP)

> Documento de referência para **consultar a base de bairros** do projeto Renato
> Pellizzari em outra sessão. Descreve o que existe, onde está, os esquemas e
> como responder perguntas (votos/eleitos por bairro). Tudo é reproduzível pelos
> scripts citados. Projeto: Next.js 16 em `/Volumes/Extreme SSD/AI-Projects/Renato Pellizzari`.

## 1. O que essa base resolve

Atribuir o **bairro real** de cada **local de votação** do TSE (eleições 2022 e
2024) e, com isso, agregar **votos por candidato por bairro** corretamente — em
vez do método antigo (1 bairro "sede" por zona eleitoral inteira).

Método: o TSE publica o **CEP** de cada local de votação; cruzamos esse CEP com a
base **RUACEP** (ruacep.com.br → CEP→bairro de todo o RJ) e canonizamos para o
conjunto de **162 bairros oficiais** do Rio. Fallback: o `NM_BAIRRO` do próprio TSE.

Resultado na capital: **99% dos locais** recebem o bairro via CEP/RUACEP, **100%**
caem em bairro oficial. Divergência RUACEP×TSE ~17% — quase toda em **divisa de
bairros vizinhos** (o CEP/Correios é a resposta certa para "qual bairro oficial
contém o ponto").

## 2. Conjunto oficial de bairros (alvo do join geográfico)

`src/lib/rio-bairros-geo.ts` — **162 bairros** oficiais da cidade do Rio (Data.Rio),
com geometria SVG. Interface `BairroGeo { nome; ra; rp; d; cx; cy }`. Os nomes em
`nome:` são a **grafia canônica** (ex.: "Brás de Pina", "Osvaldo Cruz",
"Freguesia (Ilha)", "Freguesia (Jacarepaguá)", "Recreio dos Bandeirantes").
É contra esse conjunto que os votos por bairro devem casar (por nome normalizado).

Normalização de nome usada em todo o projeto:
```js
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
```
Atenção: `norm` NÃO colapsa z/s ("Braz"≠"Bras") nem qualifica "Freguesia" — por
isso existe o alias map (seção 4).

## 3. Datasets gerados (a "base de bairros")

Todos versionados (leves). Encoding UTF-8 (CSVs com BOM).

### 3.1 RUACEP — dicionário CEP → bairro (todo o RJ)
`public/geo/ceps-rj.csv` — **110.476 linhas**. Colunas:
```
uf,municipio,ibge,bairro,cep,logradouro,complemento,url
```
- `cep` no formato `NNNNN-NNN`. `bairro`/`municipio` acentuados.
- Chave de consulta: `cep` (8 dígitos). Um CEP → um bairro.
- Cobertura: ~69% dos CEPs de locais de votação batem aqui (resto cai no TSE).
- Resumo por bairro: `public/geo/ceps-rj-bairros.csv` (faixa de CEP por bairro).

### 3.2 Locais de votação → bairro (todo o RJ, 2022 e 2024) — PRINCIPAL
`src/data/eleicoes/locais-bairro.csv` — **9.794 locais** (2022+2024, todo RJ). Colunas:
```
ano,cd_municipio,municipio,zona,nr_local,nm_local,endereco,cep,
bairro_tse,bairro_ruacep,bairro_final,fonte,oficial,lat,lon
```
- `bairro_final` = bairro a usar (RUACEP via CEP, canonizado; senão TSE).
- `fonte` ∈ {`ruacep-cep`, `tse`}. `oficial` = "sim" se `bairro_final` ∈ 162 oficiais (capital).
- `bairro_tse` e `bairro_ruacep` são os crus (auditoria).
- Chave do local: (`cd_municipio`, `zona`, `nr_local`). Capital: `municipio == "RIO DE JANEIRO"`.

Mapa pronto para join (mesma info, formato chave→valor):
`src/data/eleicoes/_locais-bairro-map.json` — `{ "<ano>|<cdMun>|<zona>|<nrLocal>": "<bairro_final>" }`.

### 3.3 Votos por bairro — candidato Renato (capital)
`src/data/eleicoes/renato-bairros-2022.json` e `-2024.json`:
```json
[{ "bairro": "Tijuca", "votos": 828, "totalCargo": 98302, "locais": 53, "pctNoBairro": 0.00842 }]
```
- `votos` = votos do Renato no bairro; `totalCargo` = votos nominais do cargo nos locais do bairro.
- 2022 (Dep. Estadual) soma 13.704 na capital; 2024 (Vereador) soma 6.783. Bairros com voto: 148 / 144.

### 3.4 Votos por local — candidato Renato (capital, com bairro real)
`src/data/eleicoes/renato-locais-bairro-2022.json` e `-2024.json`:
```json
[{ "zona": 7, "nrLocal": "1112", "nome": "COLÉGIO ...", "endereco": "RUA ...", "bairro": "Tijuca", "votos": 82 }]
```

### 3.5 Rótulo zona → bairro predominante
`src/data/eleicoes/zona-bairro.json` — `{ "<zona>": "<bairro>" }` (bairro com mais
locais na zona; só rótulo, NÃO use para agregar votos).

## 4. Como o `bairro_final` é decidido (regra de canonização)

Para a CAPITAL (`scripts/locais-bairro.mjs`, fase `map` + função `canonBairro`):
1. CEP do local (TSE) → RUACEP (`ceps-rj.csv`) devolve `{ município, bairro }`.
2. **Guard de município (capital):** se o `município` do RUACEP ≠ "Rio de Janeiro",
   o CEP é de divisa e aponta p/ cidade vizinha (ex.: `25565-000` → São João de Meriti,
   bairro "Jardim José Bonifácio"); nesse caso **descarta** o `bairro_ruacep` e usa o
   `NM_BAIRRO` do TSE, que conhece o município real. Implementado em `faseMap` pela flag
   `hitMunicipioOk` (`!capital || norm(hit.municipio) === norm(CAPITAL)`).
3. Canoniza p/ os 162 oficiais: aplica ALIASES e desambigua "Freguesia".
4. `bairro_final` = `bairro_ruacep` canonizado (se passou no guard); senão `bairro_tse` canonizado.

ALIASES (norm → oficial): `BRAZ DE PINA→Brás de Pina`, `OSWALDO CRUZ→Osvaldo Cruz`,
`RECREIO→Recreio dos Bandeirantes`, `FREGUESIA JPA→Freguesia (Jacarepaguá)`,
`FREGUESIA (ILHA DO GOVERNADOR)→Freguesia (Ilha)`, `FUNDAO→Cidade Universitária`,
`NOVA SEPETIBA→Sepetiba`, `ILHA DE GUARATIBA→Guaratiba`, `JARDIM BANGU→Bangu`,
`RIO DAS PEDRAS→Jacarepaguá`, `BAIRRO DE FATIMA→Cidade Nova`,
`TUBIACANGA→Galeão` (vila no N. da Ilha do Governador, fora dos 162; oficialmente em Galeão).
Desambiguação: bairro "FREGUESIA" sem qualificador → CEP começa com `219` ⇒
"Freguesia (Ilha)", senão "Freguesia (Jacarepaguá)".

> **Por que "Jardim José Bonifácio" NÃO está em ALIASES:** é bairro real de São João de
> Meriti. O sintoma (1 local da capital, em Santa Cruz, com CEP de divisa) é resolvido
> de forma **geral** pelo guard do passo 2 — cai no `NM_BAIRRO` do TSE (`SANTA CRUZ`),
> corrigindo qualquer CEP "vazado" p/ cidade vizinha, não só esse caso.

**Garantia atual (validada por reconciliação):** 100% dos locais da capital caem em bairro
oficial — **0 fora dos 162**, **0 sem bairro** (1401/1401 em 2022, 1440/1440 em 2024). Os
votos por bairro somam exatamente 13.704 (2022, Dep. Estadual) e 6.783 (2024, Vereador).

Fora da capital: usa o bairro cru de RUACEP/TSE (não há conjunto oficial); o guard de
município não se aplica (interior não casa com os 162).

## 5. Arquivos BRUTOS do TSE (para consultas avançadas/outros candidatos)

NÃO versionados (`.gitignore`), presentes no disco. **Encoding ISO-8859-1 (latin1),
separador `;`, campos entre aspas**. Parser de linha:
```js
function pl(l){const o=[];let a="",q=false;for(const c of l){if(c==='"')q=!q;else if(c===';'&&!q){o.push(a);a="";}else a+=c;}o.push(a);return o;}
```

### 5.1 Cadastro de locais (CEP + bairro do TSE)  — `data/eleitorado_local_votacao_{2022,2024}/...csv` (nacional, filtrar `SG_UF=="RJ"`)
Índices 0-based: `6 SG_UF · 7 CD_MUNICIPIO · 8 NM_MUNICIPIO · 9 NR_ZONA ·
14 NR_LOCAL_VOTACAO · 15 NM_LOCAL_VOTACAO · 18 DS_ENDERECO · 19 NM_BAIRRO ·
20 NR_CEP · 22 NR_LATITUDE · 23 NR_LONGITUDE · 34 QT_ELEITOR_SECAO`.

### 5.2 Votos por candidato × SEÇÃO (votos por LOCAL) — `votacao_secao_{2022,2024}_RJ/...csv`
> 2022: `votacao_secao_2022_RJ/`; 2024: `votacao_secao_2024_RJ/` (987MB; baixado do TSE).
Índices 0-based: `13 CD_MUNICIPIO · 14 NM_MUNICIPIO · 15 NR_ZONA · 16 NR_SECAO ·
18 DS_CARGO · 20 NM_VOTAVEL · 21 QT_VOTOS · 22 NR_LOCAL_VOTACAO · 23 SQ_CANDIDATO ·
24 NM_LOCAL_VOTACAO · 25 DS_LOCAL_VOTACAO_ENDERECO`.
⚠️ **GOTCHA:** `DS_CARGO` vem em **MAIÚSCULAS** em 2022 ("DEPUTADO ESTADUAL") e em
**TitleCase** em 2024 ("Vereador"). Sempre compare com `norm()`.

### 5.3 Candidato × MUNzona (status ELEITO + nome/partido) — `data/votacao_candidato_munzona_2022/...` e `votacao_candidato_munzona_2024/...`
Nível zona (não tem local). Índices 0-based: `14 NM_MUNICIPIO · 15 NR_ZONA ·
17 DS_CARGO · 18 SQ_CANDIDATO · 19 NR_CANDIDATO · 21 NM_URNA_CANDIDATO ·
35 SG_PARTIDO · 45 QT_VOTOS_NOMINAIS · 49 DS_SIT_TOT_TURNO`.
**Eleito** = `DS_SIT_TOT_TURNO` ∈ {`ELEITO`, `ELEITO POR QP`, `ELEITO POR MÉDIA`}.
(Outros: `SUPLENTE`, `NÃO ELEITO`, `2º TURNO`.)

SQ (sequencial) do Renato: 2022 `190001639149` (Dep. Estadual); 2024 `190002266214` (Vereador).

## 6. Receitas de consulta

### 6.1 Bairro de um CEP
Procure `cep` em `ceps-rj.csv` (8 dígitos, formato `NNNNN-NNN`) → coluna `bairro`.

### 6.2 Bairro de um local de votação
Em `locais-bairro.csv`, filtre por (`ano`,`cd_municipio`,`zona`,`nr_local`) → `bairro_final`.
Ou use `_locais-bairro-map.json["<ano>|<cdMun>|<zona>|<nrLocal>"]`.

### 6.3 Locais de um bairro
Em `locais-bairro.csv`, filtre `municipio=="RIO DE JANEIRO"` e `bairro_final=="<Bairro>"`.

### 6.4 Votos de QUALQUER candidato por bairro (capital)
1. Carregue o mapa `_locais-bairro-map.json`.
2. Stream `votacao_secao_<ano>_RJ.csv`; para `NM_MUNICIPIO=="RIO DE JANEIRO"` e
   `norm(DS_CARGO)==norm(<cargo>)`: `bairro = mapa["<ano>|"+cdMun+"|"+zona+"|"+nrLocal]`;
   acumule `QT_VOTOS` por (`SQ_CANDIDATO` → `NM_VOTAVEL`) e por `bairro`.
3. Para um bairro específico, ordene os candidatos por votos.

### 6.5 "Top N eleitos no bairro X" (ex.: 5 políticos eleitos em Praça da Bandeira)
Para cada ano e cargo (2022=Dep. Estadual, 2024=Vereador):
1. Conjunto de locais do bairro X (6.3) → set de chaves (cdMun,zona,nrLocal).
2. Soma `QT_VOTOS` por `SQ_CANDIDATO` em `votacao_secao_<ano>` restrito a esses locais (e ao cargo).
3. Conjunto `ELEITOS` = SQ com `DS_SIT_TOT_TURNO` de eleito em `votacao_candidato_munzona_<ano>` (mesmo cargo).
4. Filtre os candidatos do passo 2 que estão em `ELEITOS`; ordene desc por votos no bairro; pegue os 5 primeiros.
   Use `NM_URNA_CANDIDATO` + `SG_PARTIDO` (de munzona) para exibir nome/partido.
> Obs.: o "eleito" é status global do candidato (não "eleito no bairro"); o ranking
> é por votos recebidos NAQUELE bairro, restrito a quem foi eleito.

### 6.6 Script pronto (implementa 6.4/6.5)
`node scripts/consulta-bairro.mjs "<bairro>" [ano] [--top=N] [--eleitos] [--cargo="..."] [--municipio="..."] [--json]`
- Sem ano → roda 2022 e 2024. Default de cargo: 2022=Deputado Estadual, 2024=Vereador.
- Filtra automaticamente VOTO NULO/BRANCO e voto de legenda (mantém só candidatos reais).
- `--eleitos` restringe aos eleitos; marca `✔` quem foi eleito (DS_SIT_TOT_TURNO).
- Casa o bairro por nome normalizado contra `bairro_final`; sugere nomes se não achar.
- Ex.: `node scripts/consulta-bairro.mjs "Praça da Bandeira" --eleitos --top=5`.

## 7. Scripts e ordem de execução

1. `node scripts/scrape-ceps-rj.mjs` — (raro) gera `public/geo/ceps-rj.csv` do sitemap RUACEP.
2. `node scripts/locais-bairro.mjs` — gera `locais-bairro.csv`, `_locais-bairro-map.json`,
   `zona-bairro.json`, `renato-bairros-{ano}.json`, `renato-locais-bairro-{ano}.json`.
   (Subcomandos: `map`, `votos`, `all`.)
3. `node scripts/processar-tse.mjs` — datasets de zona/município/meta; lê `zona-bairro.json`
   (não tem mais o `ZONA_BAIRRO` hardcoded).

## 8. Camada de dados no app (TS)

`src/lib/votos-data.ts`:
- `getBairros(ano)` → votos REAIS por bairro (de `renato-bairros-{ano}.json`) + quebra por zona (de `renato-locais-bairro`).
- `getLocais2022()` → locais com bairro real.
- `getMeta(ano).totalBairros` → nº real (148/144).
Consumido por `/kpis/votos-por-bairro`, `mapa-eleicao.tsx`→`electoral-map.tsx`, `/de-para`.

## 9. Limitações / gotchas

- Votos por bairro prontos só para o **Renato** e só na **capital**. Para outros
  candidatos / interior, rode a receita 6.4/6.5 sobre os brutos.
- **2024 não tinha** `votacao_secao` no repo originalmente; foi baixado do TSE.
- ~31% dos CEPs de locais não estão no RUACEP (CEPs `-000`/inválidos) → caem no `bairro_tse`.
- Divergência RUACEP×TSE (~17% capital) = divisa de bairros vizinhos; `bairro_final` segue o CEP.
- Brutos do TSE são latin1/`;`; cargo em caixa diferente entre 2022 e 2024 (use `norm`).
- Disco exFAT: `next dev` (Turbopack) falha com cache; use `next build` + `next start`.
