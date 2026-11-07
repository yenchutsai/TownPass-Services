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
