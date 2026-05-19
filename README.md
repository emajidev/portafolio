# Emanuel J.M — Portafolio

Portafolio personal con estética **Matrix / Cyberpunk**, construido con **Angular 18**, **TailwindCSS** y la mascota **Davi**.

**Repositorio:** https://github.com/emajidev/portafolio

## Stack

- Angular 18 (standalone, signals)
- TailwindCSS 3
- GSAP
- Deploy en Vercel (plan gratuito)

## Desarrollo local

```bash
npm install
npm start
```

Abre [http://localhost:4200](http://localhost:4200)

## Build

```bash
npm run build:prod
```

Salida estática: `dist/portfolio/browser`

## Deploy en Vercel

### Opción A — Desde el dashboard (recomendado)

1. Entra en [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. **Add New Project** → importa `emajidev/portafolio`.
3. Vercel detectará `vercel.json` automáticamente:
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `dist/portfolio/browser`
4. Pulsa **Deploy**.

### Opción B — CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Variables de entorno (opcional)

| Variable | Descripción |
|----------|-------------|
| — | No se requieren variables para el deploy estático |

## Estructura

```
src/app/
├── core/       # Datos y servicios
├── features/   # Mascota Davi
├── layout/     # Header, footer bar
├── pages/      # Home
└── shared/     # Matrix background
```

## Licencia

MIT © Emanuel J.M
