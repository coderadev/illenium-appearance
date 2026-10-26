local client = client

-- ---------------------------------------------------------------------------
-- Codera-style UI compatibility layer
--
-- The Codera NUI sends *partial* updates (one face feature, one overlay, one
-- tattoo) while the original illenium natives expect complete tables. The
-- helpers below keep a small "live" copy of the ped state and merge deltas
-- into it before calling the regular illenium functions.
-- ---------------------------------------------------------------------------

local live = {}
local sessionStarted = false

local function resetLive()
    live = {}
end

local function ensureLive()
    if live.face then return end
    local appearance = client.getPedAppearance(cache.ped)
    live.face = appearance.faceFeatures or {}
    live.overlays = appearance.headOverlays or {}
    live.blend = appearance.headBlend
end

local function endSession()
    sessionStarted = false
    resetLive()
end

-- UI camera names -> illenium camera presets
local CAMERA_ALIASES = {
    character = "default",
    bottoms = "bottom",
    shoes = "bottom",
}

local function copyTable(t)
    local out = {}
    for k, v in pairs(t or {}) do out[k] = v end
    return out
end

local function getOutfitsForModel()
    local outfits = lib.callback.await("illenium-appearance:server:getOutfits", false) or {}
    local model = client.getPedModel(cache.ped)
    local result = {}
    for i = 1, #outfits do
        if outfits[i].model == model then
            result[#result + 1] = outfits[i]
        end
    end
    return result
end

-- ---------------------------------------------------------------------------
-- Data / settings
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_get_locales", function(_, cb)
    cb(Locales[GetConvar("illenium-appearance:locale", "en")].UI)
end)

RegisterNUICallback("appearance_get_settings", function(_, cb)
    cb({ appearanceSettings = client.getAppearanceSettings() })
end)

RegisterNUICallback("appearance_get_data", function(_, cb)
    Wait(250)

    -- tattoos from the saved appearance are applied once per session only, so
    -- re-fetching data (e.g. after loading an outfit) never wipes changes.
    if not sessionStarted then
        sessionStarted = true
        local initial = client.getAppearance()
        if initial and initial.tattoos then
            client.setPedTattoos(cache.ped, initial.tattoos)
        end
    end
    resetLive()

    local appearanceData = client.getPedAppearance(cache.ped)
    if not appearanceData.tattoos then
        appearanceData.tattoos = client.getPedTattoos()
    end

    local uiConfig = copyTable(client.getConfig())
    uiConfig.images = (Config.UI and Config.UI.Images) or { UseCdn = true }

    -- flows that don't go through OpenShop (character creation, management...)
    -- don't set a price and are therefore free
    local free = uiConfig.price == nil or uiConfig.price <= 0
    uiConfig.isFree = free

    local money = lib.callback.await("illenium-appearance:server:getPlayerMoney", false) or { cash = 0, bank = 0 }

    cb({
        config = uiConfig,
        appearanceData = appearanceData,
        appearanceSettings = client.getAppearanceSettings(),
        isFree = free,
        theme = Config.Theme,
        money = money,
    })
end)

RegisterNUICallback("appearance_get_money", function(_, cb)
    local money = lib.callback.await("illenium-appearance:server:getPlayerMoney", false)
    cb(money or { cash = 0, bank = 0 })
end)

-- ---------------------------------------------------------------------------
-- Camera / ped rotation
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_set_camera", function(camera, cb)
    cb(1)
    if type(camera) == "table" then camera = camera.zone end
    client.setCamera(CAMERA_ALIASES[camera] or camera)
end)

RegisterNUICallback("appearance_adjust_camera", function(action, cb)
    cb(1)
    client.adjustCamera(action)
end)

RegisterNUICallback("appearance_turn_around", function(_, cb)
    cb(1)
    client.pedTurn(cache.ped, 180.0)
end)

RegisterNUICallback("appearance_rotate_camera", function(direction, cb)
    cb(1)
    client.rotateCamera(direction)
end)

RegisterNUICallback("rotate_left", function(_, cb)
    cb(1)
    client.pedTurn(cache.ped, 10.0)
end)

RegisterNUICallback("rotate_right", function(_, cb)
    cb(1)
    client.pedTurn(cache.ped, -10.0)
end)

-- ---------------------------------------------------------------------------
-- Appearance changes
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_change_model", function(model, cb)
    local playerPed = client.setPlayerModel(model)
    resetLive()

    SetEntityHeading(cache.ped, client.getHeading())
    SetEntityInvincible(playerPed, true)
    TaskStandStill(playerPed, -1)

    cb({
        appearanceSettings = client.getAppearanceSettings(),
        appearanceData = client.getPedAppearance(playerPed)
    })
end)

RegisterNUICallback("appearance_change_component", function(component, cb)
    client.setPedComponent(cache.ped, component)
    cb(client.getComponentSettings(cache.ped, component.component_id))
end)

RegisterNUICallback("appearance_get_item_settings", function(data, cb)
    if data and data.type == "prop" then
        cb(client.getPropSettings(cache.ped, data.id))
    elseif data and data.type == "component" then
        cb(client.getComponentSettings(cache.ped, data.id))
    else
        cb({})
    end
end)

RegisterNUICallback("appearance_change_prop", function(prop, cb)
    client.setPedProp(cache.ped, prop)
    cb(client.getPropSettings(cache.ped, prop.prop_id))
end)

RegisterNUICallback("appearance_change_head_blend", function(headBlend, cb)
    cb(1)
    ensureLive()
    live.blend = headBlend
    client.setPedHeadBlend(cache.ped, headBlend)
end)

RegisterNUICallback("appearance_change_face_feature", function(data, cb)
    cb(1)
    if not client.isPedFreemodeModel(cache.ped) then return end
    ensureLive()

    if data.key ~= nil then
        live.face[data.key] = data.value
    else
        for k, v in pairs(data) do live.face[k] = v end
    end

    client.setPedFaceFeatures(cache.ped, live.face)
end)

RegisterNUICallback("appearance_change_head_overlay", function(data, cb)
    cb(1)
    if not client.isPedFreemodeModel(cache.ped) then return end
    ensureLive()

    if data.key ~= nil then
        live.overlays[data.key] = {
            style = data.style,
            opacity = data.opacity,
            color = data.color,
            secondColor = data.secondColor,
        }
    else
        for k, v in pairs(data) do live.overlays[k] = v end
    end

    client.setPedHeadOverlays(cache.ped, live.overlays)
end)

RegisterNUICallback("appearance_change_hair", function(hair, cb)
    client.setPedHair(cache.ped, hair)
    cb(client.getHairSettings(cache.ped))
end)

RegisterNUICallback("appearance_change_eye_color", function(eyeColor, cb)
    cb(1)
    client.setPedEyeColor(cache.ped, eyeColor)
end)

-- ---------------------------------------------------------------------------
-- Tattoos (the Codera UI sends a single tattoo; merge it into the ped's set)
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_apply_tattoo", function(data, cb)
    -- applying is free (it's a preview); tattoos are paid for once at checkout
    local tattoo = data.tattoo

    if tattoo and tattoo.zone then
        local tattoos = client.getPedTattoos() or {}
        tattoos[tattoo.zone] = tattoos[tattoo.zone] or {}

        local replaced = false
        for i = 1, #tattoos[tattoo.zone] do
            if tattoos[tattoo.zone][i].name == tattoo.name then
                tattoos[tattoo.zone][i] = tattoo
                replaced = true
                break
            end
        end
        if not replaced then
            tattoos[tattoo.zone][#tattoos[tattoo.zone] + 1] = tattoo
        end

        client.setPedTattoos(cache.ped, tattoos)
    else
        client.addPedTattoo(cache.ped, data.updatedTattoos or data)
    end

    cb(true)
end)

-- replaces the whole tattoo set (used by "reset")
RegisterNUICallback("appearance_set_tattoos", function(tattoos, cb)
    cb(1)
    client.setPedTattoos(cache.ped, type(tattoos) == "table" and tattoos or {})
end)

RegisterNUICallback("appearance_preview_tattoo", function(previewTattoo, cb)
    cb(1)
    client.setPreviewTattoo(cache.ped, previewTattoo.data, previewTattoo.tattoo)
end)

RegisterNUICallback("appearance_delete_tattoo", function(data, cb)
    cb(1)
    if data and data.name and data.zone then
        local tattoos = client.getPedTattoos() or {}
        local list = tattoos[data.zone] or {}
        for i = #list, 1, -1 do
            if list[i].name == data.name then
                table.remove(list, i)
            end
        end
        client.setPedTattoos(cache.ped, tattoos)
    else
        client.removePedTattoo(cache.ped, data)
    end
end)

-- ---------------------------------------------------------------------------
-- Clothes toggles (kept for compatibility with the original UI)
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_wear_clothes", function(dataWearClothes, cb)
    cb(1)
    client.wearClothes(dataWearClothes.data, dataWearClothes.key)
end)

RegisterNUICallback("appearance_remove_clothes", function(clothes, cb)
    cb(1)
    client.removeClothes(clothes)
end)

-- ---------------------------------------------------------------------------
-- Saved outfits (backed by the existing illenium outfit server logic)
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_get_outfits", function(_, cb)
    cb(getOutfitsForModel())
end)

RegisterNUICallback("appearance_save_outfit", function(data, cb)
    local name = data and data.name
    if name and name ~= "" then
        TriggerServerEvent(
            "illenium-appearance:server:saveOutfit",
            name,
            client.getPedModel(cache.ped),
            client.getPedComponents(cache.ped),
            client.getPedProps(cache.ped)
        )
        Wait(500)
    end
    cb(getOutfitsForModel())
end)

RegisterNUICallback("appearance_load_outfit", function(outfit, cb)
    cb(1)
    if outfit then
        client.setPedComponents(cache.ped, outfit.components)
        client.setPedProps(cache.ped, outfit.props)
    end
end)

RegisterNUICallback("appearance_delete_outfit", function(id, cb)
    TriggerServerEvent("illenium-appearance:server:deleteOutfit", id)
    Wait(400)
    cb(getOutfitsForModel())
end)

RegisterNUICallback("appearance_generate_outfit_code", function(id, cb)
    cb(lib.callback.await("illenium-appearance:server:generateOutfitCode", false, id))
end)

RegisterNUICallback("appearance_import_outfit_code", function(data, cb)
    local success = lib.callback.await("illenium-appearance:server:importOutfitCode", false, data.name, data.code)
    if success then
        cb({ success = true, outfits = getOutfitsForModel() })
    else
        cb({ success = false, message = "Invalid code, duplicate name, or you own this outfit." })
    end
end)

-- ---------------------------------------------------------------------------
-- Save / exit
-- ---------------------------------------------------------------------------

RegisterNUICallback("appearance_save", function(data, cb)
    cb(1)
    client.setPaymentMethod(data and data.paymentMethod)
    client.setCart(data and data.cart)

    -- the ped itself is the source of truth for what the player sees
    local appearance = client.getPedAppearance(cache.ped)
    appearance.tattoos = client.getPedTattoos() or appearance.tattoos

    client.wearClothes(appearance, "head")
    client.wearClothes(appearance, "body")
    client.wearClothes(appearance, "bottom")
    endSession()
    client.exitPlayerCustomization(appearance)
end)

RegisterNUICallback("appearance_exit", function(_, cb)
    cb(1)
    endSession()
    client.exitPlayerCustomization()
end)

RegisterNUICallback("get_theme_configuration", function(_, cb)
    cb(Config.Theme)
end)
