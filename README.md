# Playbook ISP — Falhas em Jogos Online (Valenet)

Site estático (HTML/CSS/JS) **dirigido por JSON** para publicar no **GitHub Pages** e usar no dia a dia do N1/N2/CGR.

## Estrutura
- `index.html` — página principal
- `styles.css` — estilo (moderno/empresarial) e print-friendly
- `app.js` — lógica (carrega JSON, filtra, seleciona jogo, copia resumo para ticket)
- `games.json` — **fonte de verdade** (edite aqui para atualizar conteúdos)

## Como rodar local
Opção simples (Python):
```bash
python -m http.server 8080
```
Abra: `http://localhost:8080`

> Observação: `fetch('games.json')` **não funciona** abrindo o arquivo direto (`file://`). Use um servidor local.

## Publicar no GitHub Pages
1. Suba os 4 arquivos no repositório (raiz).
2. GitHub → **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** e pasta: **/ (root)**
5. Acesse a URL do Pages que o GitHub mostrar.

## Editando o JSON
Cada item em `games[]` tem:
- `top_complaints` (o que o cliente relata)
- `checks` (o que o N2 valida)
- `actions` (tratativas)
- `escalate_to_cgr_when` (critérios objetivos de escalonamento)
- `references` (links de suporte oficiais, opcionais)

## Exportar em PDF
Na página: **Ctrl + P** → **Salvar como PDF** → marcar **“Gráficos de fundo”**.

---
Feito para evoluir para versão “enterprise”: filtros por cidade/POP, export de relatório, e JSON mais detalhado (destinos/portas/ASN/upstreams).
