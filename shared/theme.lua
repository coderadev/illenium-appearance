Config.Theme = {
    currentTheme = "qb-core",
    themes = {
        {
            id = "default",
            borderRadius = "4px",
            fontColor = "255, 255, 255",
            fontColorHover = "255, 255, 255",
            fontColorSelected = "0, 0, 0",
            fontFamily = "Inter",
            primaryBackground = "0, 0, 0",
            primaryBackgroundSelected = "255, 255, 255",
            secondaryBackground = "0, 0, 0",
            scaleOnHover = false,
            sectionFontWeight = "normal",
            smoothBackgroundTransition = false
        },
        {
            id = "qb-core",
            borderRadius = "3vh",
            fontColor = "255, 255, 255",
            fontColorHover = "255, 255, 255",
            fontColorSelected = "255, 255, 255",
            fontFamily = "Poppins",
            primaryBackground = "220, 20, 60",
            primaryBackgroundSelected = "220, 20, 60",
            secondaryBackground = "23, 23, 23",
            scaleOnHover = true,
            sectionFontWeight = "bold",
            smoothBackgroundTransition = true
        },
        {
            id = "project-sloth",
            borderRadius = "6vh",
            fontColor = "255, 255, 255",
            fontColorHover = "255, 255, 255",
            fontColorSelected = "255, 255, 255",
            fontFamily = "Inter",
            primaryBackground = "2, 241, 181",
            primaryBackgroundSelected = "2, 241, 181",
            secondaryBackground = "27, 24, 69",
            scaleOnHover = true,
            sectionFontWeight = "bold",
            smoothBackgroundTransition = false
        },
        {
            id = "not-heavily-inspired",
            borderRadius = "10vh",
            fontColor = "255, 255, 255",
            fontColorHover = "255, 255, 255",
            fontColorSelected = "255, 255, 255",
            fontFamily = "Inter",
            primaryBackground = "149, 239, 119",
            primaryBackgroundSelected = "242, 163, 101",
            secondaryBackground = "25, 46, 70",
            scaleOnHover = true,
            sectionFontWeight = "bold",
            smoothBackgroundTransition = false
        }
    }
}

-- Codera-style UI -----------------------------------------------------------
-- The NUI reads accent colours (and optionally fonts/backgrounds) from the
-- active theme. Supported keys: accentColor, accentText, headerBg, headerText,
-- cardBg, cardBorder, mainTextColor, subTextColor, fontTitle, fontBody.
Config.Theme.currentTheme = "codera"
Config.Theme.themes[#Config.Theme.themes + 1] = {
    id = "codera",
    accentColor = "#1de9e6",
    accentText = "#041418",
}

Config.UI = {
    -- Clothing thumbnails shown in the grid. Use ONE of these modes:
    --   { UseCdn = true }                              ShortByte/GTA5-Cloth-Assets via jsDelivr (players need internet)
    --   { Local = true }                               web/dist/clothing/<folder>/<model>/<drawable>[_<texture>].webp
    --   { BaseUrl = "nui://my-images", Path = "clothing" }   your own resource / host
    Images = { UseCdn = true },
}
