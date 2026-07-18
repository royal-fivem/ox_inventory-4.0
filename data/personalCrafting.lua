-- ======================================================================
--  Personal crafting configuration (the CRAFTING inventory tab)
--
--  This powers the always-available Minecraft-style workbench + codex that
--  lives on the CRAFTING page of the inventory (separate from the physical
--  crafting benches configured in data/crafting.lua).
--
--  categories : fully configurable list of codex categories. Each recipe
--               references one by `category = <id>`. `order` controls sort.
--
--  recipes    : each recipe produces `result` x`count`, consuming the listed
--               `ingredients`. `layout` is OPTIONAL and lets you pick which
--               of the 9 workbench slots each ingredient sits in (shaped,
--               like Minecraft). The grid is read left-to-right, top-to-bottom:
--
--                   1 2 3
--                   4 5 6
--                   7 8 9
--
--               Put an item name in a slot, or `false` to leave it empty.
--               Omit `layout` entirely to auto-place ingredients in order.
-- ======================================================================

return {
    categories = {
        { id = 'materials', label = 'Materials', order = 0 },
        { id = 'mechanic',  label = 'Mechanic',  order = 1 },
        { id = 'medical',   label = 'Medical',   order = 2 },
        { id = 'tools',     label = 'Tools',     order = 3 },
    },

    recipes = {
        {
            id = 'lockpick',
            result = 'lockpick',
            category = 'tools',
            count = 1,
            duration = 5000,
            ingredients = {
                { name = 'metalscrap', count = 3 },
                { name = 'steel_ingot', count = 1 },
            },
            -- metalscrap top-left, steel_ingot center
            layout = { 'metalscrap', false, false, false, 'steel_ingot' },
        },
        {
            id = 'repairkit',
            result = 'repairkit',
            label = 'Repair Kit',
            category = 'mechanic',
            count = 1,
            duration = 10000,
            ingredients = {
                { name = 'metalscrap', count = 5 },
                { name = 'iron_ingot', count = 2 },
                { name = 'ducttape', count = 1 },
            },
            layout = { 'metalscrap', 'ducttape', 'iron_ingot' },
        },
        {
            id = 'bandage',
            result = 'bandage',
            category = 'medical',
            count = 1,
            duration = 2500,
            ingredients = {
                { name = 'cloth', count = 1 },
                { name = 'alcohol', count = 1 },
            },
        },
        {
            id = 'cloth',
            result = 'cloth',
            category = 'materials',
            count = 2,
            duration = 5000,
            ingredients = {
                { name = 'dirty_cloth', count = 1 },
                { name = 'alcohol', count = 1 },
            },
        },
    },

    -- ==================================================================
    --  Hidden (shapeless) recipes — NOT shown in the codex. Players must
    --  discover them by dragging the right items into the workbench and
    --  pressing Combine. Matching is by the multiset of placed items
    --  (item name + total count), position doesn't matter.
    -- ==================================================================
    hidden = {
        {
            result = 'lockpick',
            count = 1,
            duration = 4000,
            ingredients = { metalscrap = 2, ducttape = 1 },
        },
        {
            result = 'repairkit',
            count = 1,
            duration = 8000,
            ingredients = { metalscrap = 3, iron_ingot = 1, ducttape = 2 },
        },
        {
            result = 'bandage',
            count = 2,
            duration = 3000,
            ingredients = { cloth = 2 },
        },
    },
}
