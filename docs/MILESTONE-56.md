# Milestone 56: the hold's Relics (release 83)

Asked for: the third part of the third region (docs/NORTH-PLAN.md). Like milestones 54 and 55, it is **hidden** until the climb
in milestone 57.

## Nine Relics of the High Snow
Each of the hold's five new patterns has one, and every station has at least one. Five blueprints end Hearthold's families'
great stories (milestone 55). The other four come from below the old halls.

| Relic | Pattern | Station | Relic material | Its blueprint |
|---|---|---|---|---|
| **The Frostwarden** | ice axe | forge | heartstone | Captain Stenhus's great story |
| **The Thane's Ring** | ring | forge | moonsilver | Lady Hallvard's great story |
| **The Moot Axe** | axe | forge | heartstone | below the old halls |
| **The Gallery Hood** | fur hood | stretcher | wyrm-hide | Hild Vik's great story |
| **The Fellstride** | snowshoes | bench | ghost-yew | Orm Fellsson's great story |
| **The Pass-Bow** | shortbow | bench | ghost-yew | below the old halls |
| **The Keepers' Ember** | warming draught | kettle | moon-mead | Yrsa Bakke's great story |
| **The Snow-Seer's Glass** | snow-goggles | glass | starglass core | below the old halls |
| **The Hearthkeeper's Lamp** | lantern | glass | heartstone | below the old halls |

- Each has its own power and lore line, in the same form as the other regions': "It never goes out: no wind, no water and no dark
  will put it out".
- The working is the same Relic working, unchanged. A relic batch of warming draught boils down to one bottle, as the other
  brews do.
- The relic materials are the six the Reach already has. Up in the snow they come from below the old halls and from the Crown's
  Factor.
- **The great stories now come in** up in the snow. Milestone 55 held them back while their blueprints weren't Relics yet.
- **Where to look,** in the hold's words: the blueprints list says "below the old halls, now and then" and names each family's
  great story.
- Below the old halls a runner finds only the hold's blueprints; below the deep doors and the drowned town, as before.

## Three patterns that had no Relic
The axe, the lantern and the shortbow had no Relic in the Reach or on the coast. Now the hold has one for each. A Relic from
another region is offered only once its blueprint has come with the line, held or made (`Rg.relicOf`). So a Reach maker's
Old-Blood axe offers no Relic working until the Moot Axe's blueprint is in hand, and the Reach never sends anyone "below the deep
doors" to look for a blueprint that lies only below the old halls.

Before this, the last choice in `relicOf` was any Relic of the pattern. A coastal pattern carried back to the Reach (a harpoon,
say) used to show the coast's Relic as needing its blueprint; now it shows no Relic until that blueprint is held, the same rule.

## The sim (`REGION=north`, every hidden pattern found from day one)
Two 90-day runs:

| | seed 1 | seed 2 |
|---|---|---|
| the first Relic | the Thane's Ring, the Moot Axe and the Lamp, day 39 | the Thane's Ring and the Frostwarden, day 22 |
| Relics made by day 90 | 8 of 9 (the Fellstride's blueprint held, not made) | all 9, the last on day 71 |
| the last | the Pass-Bow, day 79 | the Keepers' Ember, day 71 |
| great stories under way | all five | all five (Lady Hallvard's not past its first step) |
| earned in 90 days | 1,426,000 coins | 1,463,000 coins |

- All nine blueprints were found on both seeds. A runner below the old halls can bring back any blueprint still to find, so some
  of the families' came before their great story ended, as in the Reach.
- The kettle's Relic, the Keepers' Ember, comes late (days 71 and 76).
- The Reach and the coast are unchanged: their runs (the Reach 120 days with luck on and off, the coast 90 days) are byte-identical
  to release 80.

## What didn't change
- The Reach's eleven Relics and the coast's nine: their order, where their blueprints come from and the working. The Reach's and the
  coast's sim runs are byte-identical to release 80.
- **The Nine.** Up in the snow the Reach's Nine still stand in until milestone 57. Their Relics' blueprints aren't found up there
  any more, so a shop in the snow can't finish them; the Nine of the Hearth, its shards and the climb come next.
