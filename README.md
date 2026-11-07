# TownPass-Services

TownPass-Services project made with Vue3 in Vite.

## Main Views

Each tab has its own view and route. Edit the corresponding view when working on a tab.

| Tab | View | Route |
| --- | --- | --- |
| 資訊 | `src/views/InformationView.vue` | `/information` |
| 生活地圖 | `src/views/LivingMapView.vue` | `/living-map` |
| 活動 | `src/views/EventsView.vue` | `/events` |

`src/views/HomeView.vue` contains the shared tab navigation and router outlet. `/` opens the living map by default. The map component and its data remain in `src/components/organisms/TaipeiMap.vue` and `src/data/`.

### Route Ownership

Each tab has its own route module so contributors can add pages independently:

| Tab | Route Module |
| --- | --- |
| 資訊 | `src/router/modules/information.ts` |
| 生活地圖 | `src/router/modules/living-map.ts` |
| 活動 | `src/router/modules/events.ts` |

Add information subpages in `src/views/infopage/` and register them in the `children` of `information.ts`. For example, `PhoneView.vue` is registered there as `/information/phone`. Keep route names unique across modules. `src/router/index.ts` loads the three modules and does not need to change when adding subpages within them.

## Languages

The language selector at the top right is shared by Information, Living Map, Events and information subpages. It supports Chinese (`zh-TW`), English (`en`), Thai (`th`), Vietnamese (`vi`) and Indonesian (`id`). The choice is saved in browser storage, and changing languages keeps the current page and its state.

Translation ownership follows feature ownership:

| Feature | Translation Files |
| --- | --- |
| Shared navigation and controls | `src/i18n/messages/common/{locale}.json` |
| Information and its subpages | `src/i18n/messages/information/{locale}.json` |
| Living Map | `src/i18n/messages/map/{locale}.json` |
| Events | `src/i18n/messages/events/{locale}.json` |

Use `useI18n({ useScope: 'global' })` and stable keys such as `t('information.sections.phone')` in views. Add the same key to all five language files, keeping interpolation parameters such as `{count}` unchanged. Translation modules are discovered automatically; adding strings does not require changes to `src/i18n/index.ts`. The supported languages are defined once in `src/i18n/locales.json`.

Phone numbers and external destinations are maintained once in `src/data/information-resources.json`. That file references translation keys rather than duplicating URLs per language. Adding a resource requires its data entry and a label in each language file.

`pnpm check:i18n` checks translation keys, empty messages, interpolation parameters and resource references. It also runs during `pnpm build`. Missing translations fall back to Chinese at runtime. Browser-storage failures do not prevent language switching.

Live government event notices, place names, addresses and source descriptions retain their source language unless translated content is supplied. Existing English event titles and summaries remain available in English; interface text, filters, dates and controls use the selected language.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
