if not lib then return end

local CraftingBenches = {}
local CraftingInventories = {}
local PlayerCraftQueues = {} -- Store active craft queues per player
local Items = require 'modules.items.server'
local Inventory = require 'modules.inventory.server'

---@param id number
---@param data table
local function createCraftingBench(id, data)
    CraftingBenches[id] = {}
    local recipes = data.items

    if recipes then
        for i = 1, #recipes do
            local recipe = recipes[i]
            local item = Items(recipe.name)

            if item then
                recipe.weight = item.weight
                recipe.slot = i
            else
                warn(('failed to setup crafting recipe (bench: %s, slot: %s) - item "%s" does not exist'):format(id, i,
                    recipe.name))
            end

            for ingredient, needs in pairs(recipe.ingredients) do
                if needs < 1 then
                    item = Items(ingredient)

                    if item and not item.durability then
                        item.durability = true
                    end
                end
            end
        end

        if shared.target then
            data.points = nil
        else
            data.zones = nil
        end

        -- Register crafting bench inventory if configured
        local invName = ('crafting:%s'):format(id)
        CraftingInventories[id] = {
            name = invName,
            label = data.label or 'Crafting Bench',
            slots = data.inventory?.slots or 50,
            maxWeight = data.inventory?.maxWeight or 25000,
        }

        CraftingBenches[id] = data
    end
end

exports('RegisterCraftStation', function(id, data)
	createCraftingBench(id, data)
	TriggerClientEvent('ox_inventory:registerCraftingBench', -1, id, data)
end)

lib.callback.register('ox_inventory:getCraftingBenches', function(source)
    return CraftingBenches
end)

for id, data in pairs(lib.load('data.crafting') or {}) do createCraftingBench(data.name or id, data) end

---falls back to player coords if zones and points are both nil
---@param source number
---@param bench table
---@param index number
---@return vector3
local function getCraftingCoords(source, bench, index)
    if not bench.zones and not bench.points then
        return GetEntityCoords(GetPlayerPed(source))
    else
        return shared.target and bench.zones[index].coords or bench.points[index]
    end
end

lib.callback.register('ox_inventory:openCraftingBench', function(source, id, index)
    local left, bench = Inventory(source), CraftingBenches[id]

    if not left then return end

    if bench then
        local groups = bench.groups
        local coords = getCraftingCoords(source, bench, index)

        if not coords then return end

        if groups and not server.hasGroup(left, groups) then return end
        if bench.reqDuty then
            local group = server.hasGroup(left, groups)
            if group then
                local onDuty = server.isOnDuty(source, group)
                if not onDuty then return end
            end
        end
        if bench.rep and not server.hasRep(source, bench.rep) then return end
        if #(GetEntityCoords(GetPlayerPed(source)) - coords) > 10 then return end

        if left.open and left.open ~= source then
            local inv = Inventory(left.open) --[[@as OxInventory]]

            -- Why would the player inventory open with an invalid target? Can't repro but whatever.
            if inv and inv.player then
                inv:closeInventory()
            end
        end

        left:openInventory(left)

        -- Load or create crafting bench inventory
        local craftingInventory = nil
        local craftingInvData = CraftingInventories[id]

        if craftingInvData then
            local invName = craftingInvData.name
            craftingInventory = Inventory(invName)
            
            if not craftingInventory then
                craftingInventory = Inventory.Create(
                    invName,
                    craftingInvData.label,
                    'stash',
                    craftingInvData.slots,
                    0,
                    craftingInvData.maxWeight,
                    nil,
                    nil,
                    groups
                )
                craftingInventory.coords = coords
            end

            if craftingInventory then
                left:openInventory(craftingInventory)
            end
        end

        local response = {
            label = left.label,
            type = left.type,
            slots = left.slots,
            weight = left.weight,
            maxWeight = left.maxWeight
        }

        if craftingInventory then
            response.craftingInventory = {
                id = craftingInventory.id,
                label = craftingInventory.label,
                type = 'crafting_storage',
                slots = craftingInventory.slots,
                weight = craftingInventory.weight,
                maxWeight = craftingInventory.maxWeight,
                items = craftingInventory.items
            }
        end

        return response
    end
end)

local TriggerEventHooks = require 'modules.hooks.server'

lib.callback.register('ox_inventory:craftItem', function(source, id, index, recipeId, toSlot)
    local left, bench = Inventory(source), CraftingBenches[id]

    if not left then return end

    if bench then
        local groups = bench.groups
        local coords = getCraftingCoords(source, bench, index)

        if groups and not server.hasGroup(left, groups) then return end
        if bench.reqDuty then
            local group = server.hasGroup(left, groups)
            if group then
                local onDuty = server.isOnDuty(source, group)
                if not onDuty then return end
            end
        end
        if bench.rep and not server.hasRep(source, bench.rep) then return end
        if #(GetEntityCoords(GetPlayerPed(source)) - coords) > 10 then return end

        local recipe = bench.items[recipeId]

        if recipe then
            local tbl, num = {}, 0

            for name in pairs(recipe.ingredients) do
                num = num + 1
                tbl[num] = name
            end

            local craftedItem = Items(recipe.name)
            local craftCount = (type(recipe.count) == 'number' and recipe.count) or
                (table.type(recipe.count) == 'array' and math.random(recipe.count[1], recipe.count[2])) or 1

            -- Modified weight calculation
            local newWeight = left.weight
            local items = Inventory.Search(left, 'slots', tbl) or {}
            ---@todo new iterator or something to accept a map
            -- First subtract weight of ingredients that will be removed
            for name, needs in pairs(recipe.ingredients) do
                if needs > 0 then
                    local item = Items(name)
                    if item then
                        newWeight -= (item.weight * needs)
                    end
                end
            end

            -- Add weight of crafted item
            newWeight = newWeight + ((craftedItem.weight + (recipe.metadata?.weight or 0)) * craftCount)

            if newWeight > left.maxWeight then return false, 'cannot_carry' end

            local items = Inventory.Search(left, 'slots', tbl) or {}
            table.wipe(tbl)

            for name, needs in pairs(recipe.ingredients) do
                if needs == 0 then break end

                local slots = items[name] or items

                if #slots == 0 then return end

                for i = 1, #slots do
                    local slot = slots[i]

                    if needs == 0 then
                        if not slot.metadata.durability or slot.metadata.durability > 0 then
                            break
                        end
                    elseif needs < 1 then
                        local item = Items(name)
                        local durability = slot.metadata.durability

                        if durability and durability >= needs * 100 then
                            if durability > 100 then
                                local degrade = (slot.metadata.degrade or item.degrade) * 60
                                local percentage = ((durability - os.time()) * 100) / degrade

                                if percentage >= needs * 100 then
                                    tbl[slot.slot] = needs
                                    break
                                end
                            else
                                tbl[slot.slot] = needs
                                break
                            end
                        end
                    elseif needs <= slot.count then
                        tbl[slot.slot] = needs
                        break
                    else
                        tbl[slot.slot] = slot.count
                        needs -= slot.count
                    end

                    if needs == 0 then break end
                    -- Player does not have enough items (ui should prevent crafting if lacking items, so this shouldn't trigger)
                    if needs > 0 and i == #slots then return end
                end
            end

            if not TriggerEventHooks('craftItem', {
                    source = source,
                    benchId = id,
                    benchIndex = index,
                    recipe = recipe,
                    toInventory = left.id,
                    toSlot = toSlot,
                }) then
                return false
            end

            local success = lib.callback.await('ox_inventory:startCrafting', source, id, recipeId)

            if success then
                for name, needs in pairs(recipe.ingredients) do
                    if Inventory.GetItemCount(left, name) < needs then return end
                end

                for slot, count in pairs(tbl) do
                    local invSlot = left.items[slot]

                    if not invSlot then return end

                    if count < 1 then
                        local item = Items(invSlot.name)
                        local durability = invSlot.metadata.durability or 100

                        if durability > 100 then
                            local degrade = (invSlot.metadata.degrade or item.degrade) * 60
                            durability -= degrade * count
                        else
                            durability -= count * 100
                        end

                        if invSlot.count > 1 then
                            local emptySlot = Inventory.GetEmptySlot(left)

                            if emptySlot then
                                local newItem = Inventory.SetSlot(left, item, 1, table.deepclone(invSlot.metadata),
                                    emptySlot)

                                if newItem then
                                    Items.UpdateDurability(left, newItem, item, durability < 0 and 0 or durability)
                                end
                            end

                            invSlot.count -= 1
                            invSlot.weight = Inventory.SlotWeight(item, invSlot)

                            left:syncSlotsWithClients({
                                {
                                    item = invSlot,
                                    inventory = left.id
                                }
                            }, true)
                        else
                            Items.UpdateDurability(left, invSlot, item, durability < 0 and 0 or durability)
                        end
                    else
                        local removed = invSlot and Inventory.RemoveItem(left, invSlot.name, count, nil, slot)
                        -- Failed to remove item (inventory state unexpectedly changed?)
                        if not removed then return end
                    end
                end

                local targetSlot = nil
                for i = 10, left.slots do
                    if not left.items[i] then
                        targetSlot = i
                        break
                    end
                end

                if targetSlot then
                    local newItem = Inventory.SetSlot(left, craftedItem, craftCount, recipe.metadata or {}, targetSlot)

                    if newItem then
                        left:syncSlotsWithClients({
                            {
                                item = newItem,
                                inventory = left.id
                            }
                        }, true)
                    end
                else
                    Inventory.AddItem(left, craftedItem, craftCount, recipe.metadata or {})
                end
            end

            return success
        end
    end
end)

-- Helper function to execute a single craft
local function executeCraft(source, benchId, craftingInvName, recipe, quantity)
    local craftingInventory = Inventory(craftingInvName)
    if not craftingInventory then return false, 'crafting_inventory_not_found' end

    local craftedItem = Items(recipe.name)
    if not craftedItem then return false, 'invalid_item' end

    -- Calculate how many we're crafting
    local craftCount = (type(recipe.count) == 'number' and recipe.count) or 
        (table.type(recipe.count) == 'array' and math.random(recipe.count[1], recipe.count[2])) or 1
    local totalCraftCount = craftCount * quantity

    -- Check if crafting inventory has all required ingredients
    for ingredientName, needs in pairs(recipe.ingredients) do
        local totalNeeds = needs * quantity
        local availableCount = Inventory.GetItemCount(craftingInvName, ingredientName)
        
        if availableCount < totalNeeds then
            return false, 'insufficient_materials'
        end
    end

    -- Calculate weight after crafting
    local newWeight = craftingInventory.weight
    
    -- Subtract weight of ingredients that will be removed
    for ingredientName, needs in pairs(recipe.ingredients) do
        if needs > 0 then
            local item = Items(ingredientName)
            if item then
                newWeight -= (item.weight * needs * quantity)
            end
        end
    end
    
    -- Add weight of crafted items
    newWeight += (craftedItem.weight + (recipe.metadata?.weight or 0)) * totalCraftCount
    
    if newWeight > craftingInventory.maxWeight then 
        return false, 'cannot_carry' 
    end

    -- Remove ingredients from crafting inventory
    for ingredientName, needs in pairs(recipe.ingredients) do
        local totalNeeds = needs * quantity
        if totalNeeds > 0 then
            local removed = Inventory.RemoveItem(craftingInvName, ingredientName, totalNeeds)
            if not removed then
                return false, 'failed_to_remove_ingredient'
            end
        end
    end

    -- Add crafted item to crafting inventory
    local added = Inventory.AddItem(craftingInvName, craftedItem.name, totalCraftCount, recipe.metadata or {})
    if not added then
        return false, 'failed_to_add_item'
    end

    -- Notify player of crafted item
    TriggerClientEvent('ox_inventory:itemNotify', source, { { name = craftedItem.name, count = totalCraftCount, metadata = recipe.metadata or {} }, 'ui_added',  totalCraftCount  })

    return true, 'success'
end

-- Callback for single craft from UI (immediate)
lib.callback.register('ox_inventory:craftFromCraftingInventory', function(source, benchId, recipeId, quantity)
    local player = Inventory(source)
    if not player then return false, 'invalid_player' end

    local bench = CraftingBenches[benchId]
    if not bench then return false, 'invalid_bench' end

    local craftingInvConfig = CraftingInventories[benchId]
    if not craftingInvConfig then return false, 'no_crafting_inventory' end

    local recipe = bench.items[recipeId]
    if not recipe then return false, 'invalid_recipe' end

    local craftingInvName = craftingInvConfig.name
    
    return executeCraft(source, benchId, craftingInvName, recipe, quantity)
end)

-- New callback for starting a craft queue that persists after closing inventory
lib.callback.register('ox_inventory:startCraftQueue', function(source, benchId, queueData)
    local player = Inventory(source)
    if not player then return false, 'invalid_player' end

    local bench = CraftingBenches[benchId]
    if not bench then return false, 'invalid_bench' end

    local craftingInvConfig = CraftingInventories[benchId]
    if not craftingInvConfig then return false, 'no_crafting_inventory' end

    local craftingInvName = craftingInvConfig.name

    -- Cancel any existing queue for this player
    if PlayerCraftQueues[source] then
        PlayerCraftQueues[source].cancelled = true
    end

    -- Store the queue
    PlayerCraftQueues[source] = {
        benchId = benchId,
        craftingInvName = craftingInvName,
        queue = queueData,
        cancelled = false
    }

    -- Process the queue asynchronously
    CreateThread(function()
        local queueInfo = PlayerCraftQueues[source]
        if not queueInfo then return end

        for i, craftData in ipairs(queueInfo.queue) do
            -- Check if queue was cancelled
            if queueInfo.cancelled or not PlayerCraftQueues[source] then
                break
            end

            local recipe = bench.items[craftData.recipeId]
            if recipe then
                -- Wait for the craft duration
                Wait(craftData.duration)

                -- Check again if cancelled during wait
                if queueInfo.cancelled or not PlayerCraftQueues[source] then
                    break
                end

                executeCraft(source, benchId, craftingInvName, recipe, craftData.quantity)
            end
        end

        -- Clear the queue when done
        if PlayerCraftQueues[source] then
            PlayerCraftQueues[source] = nil
        end
    end)

    return true, 'queue_started'
end)

-- Cancel craft queue when player disconnects
AddEventHandler('playerDropped', function()
    local source = source
    if PlayerCraftQueues[source] then
        PlayerCraftQueues[source].cancelled = true
        PlayerCraftQueues[source] = nil
    end
end)

-- ======================================================================
--  Personal crafting (always-available workbench on the CRAFTING tab)
--  Consumes ingredients from and returns the result to the player's own
--  inventory. Configured in data/personalCrafting.lua.
-- ======================================================================
local PersonalCrafting = lib.load('data.personalCrafting') or { categories = {}, recipes = {} }
local PersonalRecipes = {}

for _, recipe in ipairs(PersonalCrafting.recipes or {}) do
    if recipe.id then
        if not Items(recipe.result) then
            warn(('personal crafting recipe "%s" references unknown result item "%s"'):format(recipe.id, recipe.result))
        end
        PersonalRecipes[recipe.id] = recipe
    end
end

lib.callback.register('ox_inventory:getPersonalCrafting', function(source)
    return PersonalCrafting
end)

lib.callback.register('ox_inventory:craftPersonalRecipe', function(source, recipeId, count)
    local inv = Inventory(source)
    if not inv then return false, 'invalid_player' end

    local recipe = PersonalRecipes[recipeId]
    if not recipe then return false, 'invalid_recipe' end

    local craftedItem = Items(recipe.result)
    if not craftedItem then return false, 'invalid_recipe' end

    count = (type(count) == 'number' and count >= 1) and count or 1

    local craftCount = (type(recipe.count) == 'number' and recipe.count) or 1
    local totalCraftCount = craftCount * count

    -- verify the player owns every ingredient
    for _, ingredient in ipairs(recipe.ingredients) do
        local needed = ingredient.count * count
        if Inventory.GetItemCount(inv, ingredient.name) < needed then
            return false, 'insufficient_materials'
        end
    end

    -- ensure the crafted result can be carried
    if not Inventory.CanCarryItem(inv, craftedItem.name, totalCraftCount, recipe.metadata) then
        return false, 'cannot_carry'
    end

    -- consume ingredients
    for _, ingredient in ipairs(recipe.ingredients) do
        local needed = ingredient.count * count
        if needed > 0 then
            local removed = Inventory.RemoveItem(inv, ingredient.name, needed)
            if not removed then return false, 'failed_to_remove_ingredient' end
        end
    end

    -- add the crafted item
    local added = Inventory.AddItem(inv, craftedItem.name, totalCraftCount, recipe.metadata or {})
    if not added then return false, 'failed_to_add_item' end

    TriggerClientEvent('ox_inventory:itemNotify', source,
        { { name = craftedItem.name, count = totalCraftCount, metadata = recipe.metadata or {} }, 'ui_added', totalCraftCount })

    return true, 'success'
end)

-- ======================================================================
--  Hidden (shapeless) crafting — items dragged into the workbench are
--  matched against undiscovered recipes. No match => error, nothing crafted.
-- ======================================================================
local PersonalHidden = PersonalCrafting.hidden or {}

---@param recipeIngredients table<string, number>
---@param placed table<string, number>
---@return boolean
local function ingredientsMatch(recipeIngredients, placed)
    local recipeKeys = 0
    for name, needed in pairs(recipeIngredients) do
        recipeKeys = recipeKeys + 1
        if (placed[name] or 0) ~= needed then return false end
    end

    local placedKeys = 0
    for _ in pairs(placed) do placedKeys = placedKeys + 1 end

    return recipeKeys == placedKeys
end

-- normalise a recipe's ingredients to a { name = count } map, accepting both
-- the codex array form ({ { name=, count= } }) and the hidden map form
local function getIngredientMap(recipe)
    local map = {}
    local ing = recipe.ingredients
    if not ing then return map end

    if ing[1] then
        for i = 1, #ing do
            local e = ing[i]
            if e and e.name then map[e.name] = (map[e.name] or 0) + (e.count or 0) end
        end
    else
        for name, c in pairs(ing) do map[name] = c end
    end

    return map
end

lib.callback.register('ox_inventory:craftHiddenRecipe', function(source, items)
    local inv = Inventory(source)
    if not inv then return false, 'invalid_player' end
    if type(items) ~= 'table' then return false, 'no_recipe' end

    -- normalise the placed multiset (name -> total count)
    local placed = {}
    for name, count in pairs(items) do
        count = math.floor(tonumber(count) or 0)
        if count > 0 then placed[name] = count end
    end
    if not next(placed) then return false, 'no_recipe' end

    -- match against the normal (codex) recipes first, then the hidden ones
    local recipe
    for _, r in ipairs(PersonalCrafting.recipes or {}) do
        if ingredientsMatch(getIngredientMap(r), placed) then
            recipe = r
            break
        end
    end
    if not recipe then
        for i = 1, #PersonalHidden do
            if ingredientsMatch(PersonalHidden[i].ingredients, placed) then
                recipe = PersonalHidden[i]
                break
            end
        end
    end
    if not recipe then return false, 'no_recipe' end

    local craftedItem = Items(recipe.result)
    if not craftedItem then return false, 'invalid_recipe' end

    local craftCount = (type(recipe.count) == 'number' and recipe.count) or 1

    -- verify the player still owns everything
    for name, needed in pairs(recipe.ingredients) do
        if Inventory.GetItemCount(inv, name) < needed then
            return false, 'insufficient_materials'
        end
    end

    if not Inventory.CanCarryItem(inv, craftedItem.name, craftCount, recipe.metadata) then
        return false, 'cannot_carry'
    end

    for name, needed in pairs(recipe.ingredients) do
        if needed > 0 then
            local removed = Inventory.RemoveItem(inv, name, needed)
            if not removed then return false, 'failed_to_remove_ingredient' end
        end
    end

    local added = Inventory.AddItem(inv, craftedItem.name, craftCount, recipe.metadata or {})
    if not added then return false, 'failed_to_add_item' end

    TriggerClientEvent('ox_inventory:itemNotify', source,
        { { name = craftedItem.name, count = craftCount, metadata = recipe.metadata or {} }, 'ui_added', craftCount })

    return true, 'success'
end)

-- ======================================================================
--  Phone SIM preview — returns the first two slots of the phone's
--  container so the utility side-boxes can show SIM cards while closed.
-- ======================================================================
lib.callback.register('ox_inventory:getPhoneContents', function(source)
    local inv = Inventory(source)
    if not inv then return {} end

    -- find the phone and its container id
    local containerId
    for _, item in pairs(inv.items) do
        if item and item.name == 'phone' and item.metadata and item.metadata.container then
            containerId = item.metadata.container
            break
        end
    end
    if not containerId then return {} end

    local container = Inventory(containerId)
    if not container or not container.items then return {} end

    -- return the first two slots (false = empty), matching the two side boxes
    local result = {}
    for i = 1, 2 do
        local item = container.items[i]
        if item and item.name then
            result[i] = {
                slot = item.slot,
                name = item.name,
                count = item.count,
                weight = item.weight,
                metadata = item.metadata,
                label = item.label,
                rarity = item.rarity or (Items(item.name) and Items(item.name).rarity),
            }
        else
            result[i] = false
        end
    end

    return result
end)
