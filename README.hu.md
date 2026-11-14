# 🔢 2048

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Egy minimális, típusbiztos 2048 **React 18**, **Vite** és **TypeScript** alapokon – billentyűzettel és érintéssel is játszható, rácsalapú DOM, nincs canvas, játékmotor vagy animációs könyvtár.
Önállóan fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyike.

[![CI](https://github.com/ZoliQua/2048-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/2048-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalomjegyzék

- [A Zoltan's Arcade család](#-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors indítás](#-gyors-indítás)
- [Irányítás](#%EF%B8%8F-irányítás)
- [Mobilon](#-mobilon)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Hogyan működik](#-hogyan-működik)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is becsatlakozik. Egy közös dizájnrendszeren, egy pontozási modellen és egy mentési formátumon osztoznak a beépített [`src/arcade/`](./src/arcade) készleten keresztül.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 **2048** (ez a repó) | [2048-Game](https://github.com/ZoliQua/2048-Game) | Logikai |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Labdaütő |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logikai |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🎮 **Klasszikus 2048** fix 4×4-es rácson
- 🧮 **Egyszeri összeolvadás lépésenként** – az összeolvadásból született lap ugyanabban a lépésben nem olvadhat össze újra
- 🎯 **A haladási irány felőli összeolvadás sorrendje** – `[2,2,2,2]` → `[4,4,0,0]`, soha nem `[8,0,0,0]`
- 🎲 **Súlyozott új lap** – minden sikeres lépés után egy 2-es (90%) vagy 4-es (10%) kerül egy véletlen üres mezőre
- 🏆 **Győzelem 2048-nál** tartósan megjegyzett győzelmi jelzéssel és **Folytatom** választással a még nagyobb lapokért
- ⏪ **Visszavonás** – az utolsó 2 lépés visszavehető (a mentésben is benne van)
- 📱 **Érintéses játék** – húzás a táblán (24 px küszöb, domináns tengely, a készlet `useSwipe`-ján keresztül); az oldal az ujjad alatt soha nem görög és nem frissül lehúzásra
- 📖 **Szabályok ablak** összeolvadási ábrával (8 + 8 → 16) három nyelven; megnyitáskor a játék szünetel
- 🏁 **Idő előtti befejezés** – szándékosan lezárhatod a játékot, és az aktuális pontszám felkerül a ranglistára
- ⛶ **Teljes képernyő** – valódi teljes képernyő, ahol a böngésző támogatja, iPhone-on magával ragadó oldalmód
- 💫 **Csak CSS-animációk** – csúszás, megjelenés, összeolvadási lüktetés (a *csökkentett mozgás* beállítást tiszteletben tartva)
- 💾 **Automatikus mentés és folytatás** – bezárhatod a lapot a játék közben, és ott folytathatod, ahol abbahagytad, a visszavonási előzményekkel együtt
- 🏅 **Egységes arcade-statisztika** – rekord, játékok, győzelmek, összidő, a portállal közösen
- ⏱️ **Szünetre érzékeny játékidő**, amely az első lépéseddel indul
- 🌗 **Sötét / világos téma**, minden arcade-játékban ugyanaz (**T** billentyű)
- 🌍 **Három nyelv** – angol, magyar és német; a felső sávban vagy a beállításokban váltható (linkben `?lang=en|hu|de` is); a számok a nyelv szerinti csoportosítással jelennek meg
- 🦷 **Fogas mód** – „Fogas mód” / "Dental mode" / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ban közös: a számok maradnak, a lapok rajza a tejfogtól a maradó fogakon át az aranykoronáig nő 2048-nál; csak megjelenés
- 🤖 **Bemutató demó** (`<Game2048Demo />`) – a valódi motort egy expectimax-lite robotpilóta játssza, a portál kezdőlapján látható
- ⌨️ **Billentyűzet-központú**; a gyorsbillentyűket figyelmen kívül hagyja, ha űrlapmezőbe írsz vagy Cmd/Ctrl/Alt le van nyomva
- 🧪 **Tesztelt** – tiszta logikai tesztek és komponenstesztek Vitesttel + Testing Library-vel

## 🚀 Gyors indítás

**Node ≥ 20** és npm szükséges.

```bash
git clone https://github.com/ZoliQua/2048-Game.git
cd 2048-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív útvonalakat használ, így a `dist/` bármelyik almappából kiszolgálható.

## ⌨️ Irányítás

| Billentyű | Művelet |
| --- | --- |
| ⬆️ ⬇️ ⬅️ ➡️ / **W A S D** | Az összes lap csúsztatása |
| 👆 Húzás a táblán | Csúsztatás a húzás irányába |
| **U** | Visszavonás (legfeljebb az utolsó 2 lépés) |
| **Szóköz** / **Enter** | Szünet · folytatás · folytatás a 2048 után · új játék, ha vége |
| **P** / **Esc** | Szünet / folytatás |
| **C** | Folytatás a 2048 elérése után |
| **R** | Új játék |
| **T** | Sötét / világos téma váltása (önálló oldal) |
| Szabályok / Befejezés / Teljes képernyő gomb | Szabályok (szünetelteti a játékot), idő előtti befejezés, teljes képernyő |

A nyílbillentyűk `preventDefault()`-ot hívnak, így az oldal játék közben sosem görög; a tábla gesztustábla (`touch-action: none`), ezért a húzás sem görgeti az oldalt, és nem vált ki lehúzásos frissítést.

### 📱 Mobilon

Húzd az ujjad a táblán a lapok csúsztatásához; a Visszavonás, Szünet, Szabályok, Befejezés és Teljes képernyő gomb alatta található. iPhone-on a Teljes képernyő magával ragadó oldalmódot használ; böngészősáv nélküli játékhoz használd a Megosztás → Főképernyőhöz adás lehetőséget.

## 🎯 Pontozás és statisztika

Minden összeolvadás a **keletkezett lap értékét** adja a pontszámhoz (a szokásos 2048-szabály).

| Összeolvadás | Pont |
| --- | ---: |
| `2 + 2 → 4` | **+4** |
| `4 + 4 → 8` | **+8** |
| `8 + 8 → 16` | **+16** |
| `512 + 512 → 1024` | **+1024** |
| `1024 + 1024 → 2048` | **+2048** |

Több összeolvadású lépésnél mindegyik hozzáadódik; kombóbónusz és szorzó nincs.

**A játék menete.** Az új tábla azonnal *Játékban* állapotú – nincs kezdőképernyő; a játékidő az első lépéssel indul.
A **P / Esc** szünetet tart (átfedés, a bevitel tiltva, az óra áll). A **2048** elérésekor a *Nyertél!* ablak jelenik meg **Folytatom** / **Új játék** gombbal
(amíg a választás nyitva van, az óra áll). A játék véget ér, ha nincs több lehetséges lépés – vagy ha a **Befejezés** gombot választod. Az eredmény **győzelem**, ha a
legnagyobb lap ≥ 2048, idő előtti befejezésnél **befejezett**, különben **vége**.

- 🏆 **Győzelem** – az első 2048-as lap megjeleníti a győzelmi ablakot; a `hasWon` jelzés az új játékig megmarad.
- ▶️ **Folytatom** – visszatér a játékba érintetlen pontszámmal, lapokkal, lépésekkel és győzelmi jelzéssel; a későbbi 2048-asok nem hozzák elő újra az ablakot.
- 💀 **Vereség** – minden mező foglalt, **és** nincs két oldalszomszédos egyforma lap, az új lap megjelenése *után* ellenőrizve.
- 🏁 **Idő előtti befejezés** – megerősítéssel; az aktuális pontszám felkerül a ranglistára, a játék véget ér, a mentés törlődik.
- ⏪ **Visszavonás** – minden lépés elmenti az előző állapotot (legfeljebb 2). A visszavonás játék közben és a győzelmi ablaknál működik; szünet alatt és a játék vége után tiltott (az eredmény már rögzítve van).

Amikor egy játék véget ér, a készlet egyszer rögzíti a `localStorage`-ben az `arcade.stats.2048` kulcs alatt
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
A régi `2048.highScore` kulcsot átvesszük és szinkronban tartjuk, így a korábbi buildek megőrzik a rekordodat.
Az állapotsáv **Pont · Rekord · Legnagyobb lap · Lépések · Idő** adatokat mutat.

## 💾 Automatikus mentés és folytatás

Az első lépésed után a játék nagyjából másodpercenként, valamint az oldal elrejtésekor vagy a játék eltávolításakor mentődik
(`arcade.session.2048` kulcs, sémaverzióval, betöltéskor szigorúan ellenőrizve – lapok, azonosítók, pozíciók, értékek és a
visszavonási előzmények). Újratöltéskor az **Üdv újra** üzenet jelenik meg a szüneteltetett játékkal; a függő győzelmi választás *folytatásként* tér vissza.
Az *Elmentve* jelzés melletti **Elvetés** eldobja a mentést. A befejezett játékok és az új táblák mentése automatikusan törlődik.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { Game2048, Game2048Demo } from '@arcade/2048';

<Game2048
  embedded                                   // elrejti az oldalcímet; a portál megjeleníti
  onGameOver={(score, info) => submitScore('2048', score, info?.finished)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<Game2048Demo active={cardIsVisible} />       // a kezdőlap bemutató módja
```

Mindkét komponens a `src/arcade/types.ts` közös `ArcadeGameProps` / `ArcadeDemoProps` szerződését követi.
A játékállapot így képeződik az arcade életciklusára: `running → running`, `paused`/`won → paused`, `gameOver → gameOver`
(a 2048 sosem jelent `idle` állapotot).

## 🧠 Hogyan működik

```
running ↔ paused
   │
   ├─→ won ──(folytatom)──→ running
   │                           │
   └───────────────────────────┴─→ gameOver ──(új játék)──→ running
```

Egyetlen tiszta reducer, az `advanceGame(state, action, rng): GameState` birtokol minden átmenetet. Egy lépés így zajlik:

1. **Csúsztatás és összeolvadás** – az `applyMove(state, direction)` mind a négy irányt egyetlen BALRA alapműveletből (`slideAndMergeLine`) vezeti le a `transpose` / `reverseRows` segítségével. A lapazonosítók a puszta csúsztatásnál megmaradnak; az összeolvadás új azonosítót ad, és mindkét forráslapot egy renderelésre `isDying`-nak jelöli, hogy a felület animálhassa az összeomlást.
2. **Üres lépés felismerése** – ha semmi sem mozdult vagy olvadt össze, a művelet eldobódik: nincs új lap, nem nő a lépésszám, nincs pont.
3. **Új lap** – a `spawnTile(state, rng)` egyenletesen választ egy üres mezőt, és 2-est (90%) vagy 4-est (10%) tesz rá.
4. **Győzelem-ellenőrzés** – az első 2048-as lap `won` állapotra vált (hacsak a játékos már a folytatást nem választotta).
5. **Vereség-ellenőrzés** – az új lap megjelenése *után* fut.
6. **Előzmény** – a lépés előtti állapot a `state.history`-ba kerül (legfeljebb 2) az `undo` számára.

A véletlenszám-generátor kívülről érkezik, így a logika a tesztekben determinisztikus. A `tiles` tömb a mérvadó állapot; a 4×4-es mátrixot a `tilesToBoard` csak a csúsztatás/összeolvadás számításához származtatja.

Az **animációk** csak CSS-ek, és sosem blokkolják a bevitelt: a lapok abszolút pozicionáltak `transform: translate(...)`-tel és 120 ms-os átmenettel (a stabil `id` kulcsoktól működik a csúszás), az új lapok feldobódnak, az összeolvadtak lüktetnek, a haldokló forráslapokat pedig a `commitAnimation` művelet távolítja el röviddel a lépés után.

**A demó robotpilótája** (`logic/autopilot.ts`): minden szabályos lépésre (a valódi `applyMove`-val szimulálva) átlagolja – a 2-es összes lehetséges megjelenési helyére – a legjobb követő lépés értékelését: egy sarokhoz horgonyzott kígyó-gradiens, plusz bónusz az üres mezőkért és a szomszédos egyforma párokért. Megbízhatóan épít 1024–4096-os lapokat; a demó 320 ms-onként lép, és játék vége után, vagy ha már mutatott egy 2048-ast, újraindul.

## 🧪 Szkriptek

| Szkript | Cél |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai + komponenstesztek) |
| `npm run check` | lint → typecheck → test → build (ezt futtatja a CI) |

## 🏗️ Felépítés

```
src/
  arcade/              a beépített Zoltan's Arcade készlet – itt ne szerkeszd (lásd a saját README-jét)
  logic/               tiszta játékszabályok – nincs React-import
    types.ts constants.ts grid.ts
    merge.ts           slideAndMergeLine – az 1-D összeolvadás magja
    move.ts            applyMove(state, direction)
    spawn.ts           spawnTile(state, rng) – 90/10 súlyozás 2-es és 4-es között
    win.ts             hasWon, hasLost, maxTile
    game.ts            advanceGame reducer + createInitialState, canUndo, reachedTarget
    autopilot.ts       expectimax-lite lépésválasztás a demóhoz
    persist.ts         a mentett munkamenetek futásidejű ellenőrzése (a visszavonási előzményekkel együtt)
  hooks/               useKeyboardMove (a húzás a készlet useSwipe-ját használja)
  components/          GameBoard (teljes + mini) + Tile + MergeDiagram, GameBoard.module.css
  rules.tsx            useRulesSections – a Szabályok ablak tartalma
  demo/Game2048Demo.tsx  a kezdőlap bemutató módja
  Game2048.tsx         a beágyazható játék (ArcadeGameProps)
  App.tsx              önálló oldal: <ArcadeShell><Game2048/></ArcadeShell>
  main.tsx             belépési pont; egyszer tölti be a közös arcade.css-t
  index.ts             csomag-belépési pont az Arcade-Game-Centerhez
```

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md), a [Magatartási kódex](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md) fájlt.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md) fájlban szerepelnek; a változások a [CHANGELOG.md](./CHANGELOG.md) fájlban.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Készítette ❤️-del Zoltán Dul · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
