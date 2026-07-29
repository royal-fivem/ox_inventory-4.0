<div align="center">

<h2>ox_inventory</h2>
royal's redesign of the slot-based inventory for FiveM — with built-in health, crafting &amp; experience UI

[![Requires](https://img.shields.io/badge/requires-ox__lib-blue.svg)](https://github.com/overextended/ox_lib)
[![Requires](https://img.shields.io/badge/requires-oxmysql-blue.svg)](https://github.com/overextended/oxmysql)
[![Base](https://img.shields.io/badge/base-ox__inventory-orange.svg)](https://github.com/communityox/ox_inventory)
[![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](LICENSE)

</div>

---

A ground-up UI redesign built on top of [Overextended's ox_inventory](https://github.com/communityox/ox_inventory).
All of the original inventory behaviour (slots, metadata, stashes, shops,
containers, weapons) is intact — this fork adds a tabbed interface with a
**Health &amp; Injuries**, **Crafting** and **Experience** page, a phone/SIM slot,
and a body figure that highlights injured limbs.

## Installation

1. Download the latest release.
2. Place it inside your `resources` folder.
3. Make sure [ox_lib](https://github.com/overextended/ox_lib) &amp; [oxmysql](https://github.com/overextended/oxmysql) are started before it.
4. Ensure `ox_inventory` in your `server.cfg`.
5. *(optional)* start [royal-health](https://github.com/royal-fivem/royal-health) and [royal-experience](https://github.com/royal-fivem/royal-experience) to power the Health and Experience tabs.
6. Restart the server.

The UI ships prebuilt in `web/build`, and `fxmanifest.lua` already points
`ui_page` at it. You only need to rebuild if you change anything in `web/src`
(see [Building the UI](#building-the-ui)).

## Pages

A switcher runs across the top of the inventory — click a tab, or press **Q / E**
to cycle. The **Experience** tab only appears when `royal-experience` has data.

```
Inventory     Health & Injuries     Crafting     Experience
```

## Health &amp; Injuries

The centre shows a body figure whose limbs glow **red** where the player is
hurt. The right panel holds:

- **Character Status** — a health bar and a five-segment blue armor bar.
- **Physical Form** — gym stamina.
- **Injuries** — a card per wound (body part, severity, a bleeding indicator and
  a heal button).

Data comes from `royal-health` through the `getHealthData` callback and live
`setHealthData` pushes. Injuries are accepted either as an array or as the
health script's map form, which is normalised automatically:

```lua
-- what royal-health sends
injuries = {
    ['right-leg'] = { damage = 25, bleeding = 1 },
}
```

`damage` (0-100) drives the severity tint and the *Minor / Major / Critical*
label; a truthy `bleeding` shows the bleeding indicator; the body-part key
colours the matching limb on the figure.

## Crafting

A Minecraft-style **3×3 workbench** with a recipe **codex** and a **queue**.

- Click a recipe to preview it, then **Combine** to queue a craft with a
  progress bar.
- Or drag items straight into the grid — matching a known recipe queues it just
  like clicking; matching an undiscovered *hidden* recipe crafts it on the spot.
- While the queue is running the player plays a crafting emote, which stops when
  it finishes.

## Phone &amp; SIM

The phone slot carries a single **SIM** container slot beside it. The SIM lives
inside the phone (its container metadata), so it travels with the phone — pull
the phone out and the SIM goes with it, and the container closes so it can't be
reached without a phone in the slot.

## Experience

Powered by `royal-experience`. A card per discipline opens a detail view with a
level **timeline** of unlocks. Each unlock can grant a cash reward, item rewards
(with a count badge in the corner when you get more than one), or both.

## Building the UI

From the `web/` folder:

```bash
pnpm i
pnpm build      # tsc + vite build -> web/build
```

`npm` and `bun` lockfiles are included too if you prefer those. For live
development, uncomment the dev `ui_page` line in `fxmanifest.lua` and run
`pnpm start` (Vite dev server on `:5173`).

## Integration callbacks

The client registers these NUI callbacks; the pages call them and your
resources answer them.

| Callback | Used by | Purpose |
| --- | --- | --- |
| `getHealthData` / `setHealthData` | Health | Fetch / push health, armor, stamina, injuries |
| `healInjury` | Health | Heal button — treat an injury by id |
| `getExperience` / `setExperience` | Experience | Fetch / push experience tracks |
| `getPersonalCrafting` | Crafting | Recipe config (categories + recipes) |
| `craftPersonalRecipe` | Crafting | Craft a known recipe by id |
| `craftHiddenRecipe` | Crafting | Match &amp; craft from dragged-in items |
| `craftingEmote` | Crafting | Start / stop the crafting emote |
| `getPhoneContents` / `openPhone` / `closePhone` | Phone | SIM preview and container toggling |

## 🙏 Credits

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/overextended">
        <img src="https://avatars.githubusercontent.com/u/88127058" width="100px;" alt="Overextended"/>
        <br />
        <sub><b>Overextended</b></sub>
      </a>
      <br />
      <sub>ox_inventory &amp; ox_lib</sub>
    </td>
    <td align="center">
      <a href="https://github.com/trusttyh">
        <img src="https://avatars.githubusercontent.com/u/101424789" width="100px;" alt="trusttyh"/>
        <br />
        <sub><b>trusttyh</b></sub>
      </a>
      <br />
      <sub>old ox-inventory-redesign </sub>
    </td>
  </tr>
</table>

Built on **[ox_inventory](https://github.com/communityox/ox_inventory)** and
**[ox_lib](https://github.com/overextended/ox_lib)** from the
[Overextended](https://github.com/overextended) team. This project keeps their
GPL-3.0 license.

---

<div align="center">

**[Discord](https://discord.gg/H2bCPuqeT7)**

Made with 💚 by royal for the FiveM community

</div>
