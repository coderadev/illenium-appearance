-- ---------------------------------------------------------------------------
-- Shop pricing (shared: the client builds the price list shown in the menu,
-- the server uses the very same code to work out what to actually charge).
--
-- Every item the player *changes* during a visit is charged exactly once, no
-- matter how many times they click around while trying things on. Putting an
-- item back to what it was when the menu opened costs nothing.
--
-- Base price per shop:   Config.ClothingCost / BarberCost / TattooCost / SurgeonCost
-- Optional overrides:    Config.Prices (see shared/config.lua)
-- ---------------------------------------------------------------------------

Pricing = {}

local COMPONENT_NAMES = {
    [1] = "Masks", [3] = "UpperBody", [4] = "LowerBody", [5] = "Bags", [6] = "Shoes",
    [7] = "ScarfAndChains", [8] = "Shirts", [9] = "BodyArmor", [10] = "Decals", [11] = "Jackets",
}

local PROP_NAMES = {
    [0] = "Hats", [1] = "Glasses", [2] = "Ear", [6] = "Watches", [7] = "Bracelets",
}

local MAX_CART_ITEMS = 128

local function overrides()
    return Config.Prices or {}
end

function Pricing.GetShopBase(shopType)
    if shopType == "clothing" then return Config.ClothingCost or 0 end
    if shopType == "barber" then return Config.BarberCost or 0 end
    if shopType == "tattoo" then return Config.TattooCost or 0 end
    if shopType == "surgeon" then return Config.SurgeonCost or 0 end
    return 0
end

-- Per-item override (Config.Prices.Items.Components[id][drawable] / Props[id][drawable])
-- accepts a number, or a table { default = n }.
local function itemOverride(group, id, drawable)
    local items = overrides().Items
    local list = items and items[group]
    local byId = list and (list[id] or list[tostring(id)])
    local entry = byId and (byId[drawable] or byId[tostring(drawable)])
    if type(entry) == "number" then return entry end
    if type(entry) == "table" and type(entry.default) == "number" then return entry.default end
    return nil
end

local tattooIndex
local function findTattoo(name)
    if not tattooIndex then
        tattooIndex = {}
        for _, list in pairs(Config.Tattoos or {}) do
            for i = 1, #list do
                tattooIndex[list[i].name] = list[i]
            end
        end
    end
    return tattooIndex[name]
end

-- Price of a single cart item.
-- item = { kind = "component"|"prop"|"hair"|"overlay"|"eyeColor"|"surgery"|"tattoo", id, drawable, name }
function Pricing.GetItemPrice(shopType, item)
    local base = Pricing.GetShopBase(shopType)
    local o = overrides()
    local kind = item.kind

    if kind == "component" then
        local id = tonumber(item.id)
        local specific = itemOverride("Components", id, tonumber(item.drawable))
        if specific ~= nil then return specific end
        local byCategory = o.Components and o.Components[COMPONENT_NAMES[id]]
        return type(byCategory) == "number" and byCategory or base
    elseif kind == "prop" then
        local id = tonumber(item.id)
        local specific = itemOverride("Props", id, tonumber(item.drawable))
        if specific ~= nil then return specific end
        local byCategory = o.Props and o.Props[PROP_NAMES[id]]
        return type(byCategory) == "number" and byCategory or base
    elseif kind == "hair" then
        return type(o.Hair) == "number" and o.Hair or base
    elseif kind == "overlay" then
        return type(o.Overlay) == "number" and o.Overlay or base
    elseif kind == "eyeColor" then
        return type(o.EyeColor) == "number" and o.EyeColor or base
    elseif kind == "surgery" then
        return type(o.Surgery) == "number" and o.Surgery or base
    elseif kind == "tattoo" then
        local tattoo = item.name and findTattoo(item.name)
        if tattoo and type(tattoo.cost) == "number" then return tattoo.cost end
        return type(o.Tattoo) == "number" and o.Tattoo or base
    end

    return 0
end

-- Total for a cart sent by the client. The client only says *which* items were
-- changed; every price comes from the config, so the amount can't be inflated
-- or lowered from the NUI. Duplicates are ignored.
function Pricing.GetCartTotal(shopType, cart)
    if type(cart) ~= "table" then return 0 end

    local total, seen, count, tattoosCharged = 0, {}, 0, false
    for i = 1, math.min(#cart, MAX_CART_ITEMS) do
        local item = cart[i]
        if type(item) == "table" and type(item.kind) == "string" then
            local key = ("%s:%s:%s:%s"):format(item.kind, tostring(item.id), tostring(item.drawable), tostring(item.name))
            if not seen[key] then
                seen[key] = true
                count = count + 1

                local price = Pricing.GetItemPrice(shopType, item)
                if item.kind == "tattoo" and Config.ChargePerTattoo == false then
                    -- flat fee: charge the tattoo price once for the whole visit
                    if tattoosCharged then price = 0 end
                    tattoosCharged = true
                end

                if price > 0 then total = total + price end
            end
        end
    end

    return total
end

-- Price table handed to the menu so it can show what things cost.
function Pricing.BuildUiPrices(shopType)
    local base = Pricing.GetShopBase(shopType)
    local o = overrides()

    local components, props = {}, {}
    for _, name in pairs(COMPONENT_NAMES) do
        components[name] = type(o.Components and o.Components[name]) == "number" and o.Components[name] or base
    end
    for _, name in pairs(PROP_NAMES) do
        props[name] = type(o.Props and o.Props[name]) == "number" and o.Props[name] or base
    end

    return {
        Default = base,
        Hair = type(o.Hair) == "number" and o.Hair or base,
        Overlay = type(o.Overlay) == "number" and o.Overlay or base,
        EyeColor = type(o.EyeColor) == "number" and o.EyeColor or base,
        Surgery = type(o.Surgery) == "number" and o.Surgery or base,
        Tattoo = type(o.Tattoo) == "number" and o.Tattoo or base,
        ChargePerTattoo = Config.ChargePerTattoo ~= false,
        Components = components,
        Props = props,
        Items = o.Items or {},
    }
end
