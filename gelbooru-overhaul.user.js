// ==UserScript==
// @name        Gelbooru Overhaul
// @namespace   https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/gelbooru-overhaul.user.js
// @version     1.1.1
// @description Various toggleable changes to Gelbooru such as enlarging the gallery, removing the sidebar, and more.
// @author      Enchoseon, Tsubaki Kouryuu
// @match       https://*.gelbooru.com/*
// @run-at      document-start
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_download
// @grant       GM_addStyle
// @grant       GM_addElement
// @grant       GM_getResourceText
// @resource    css 	    https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.css
// @resource    css-common 	https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul-common.css
// @require     https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.utils.js
// @require     https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.configManager.js
// @require     https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.tweaks.js
// @require     https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.themeManager.js
// @require     https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.blacklistManager.js
// @require     https://github.com/tsubaki-kouryuu/gelbooru-overhaul-userscript/raw/main/resources/gelbooru-overhaul.infiniteScrolling.js
// ==/UserScript==

(function () {
    "use strict";

    try {
        utils.onDOMReady(main);
    } catch (error) {
        alert(error);
    }

    function main() {
        context.pageType = utils.getPageType();;
        utils.debugLog("Current page type is " + context.pageType, null, true);

        let configManager = new ConfigManager();
        context.configManager = configManager;

        let themeManager = new ThemeManager();
        context.themeManager = themeManager;

        let blacklistManager = new BlacklistManager();
        context.blacklistManager = blacklistManager;

        let infiniteScrolling = new InfiniteScrolling();
        context.infiniteScrolling = infiniteScrolling;

        configManager.addUpdateListener("advancedBlacklist.enable", applyTweakAdvancedBlacklist);
        configManager.addUpdateListener("advancedBlacklist.hideMode", applyCssVariableBlacklist);
        configManager.addUpdateListener("advancedBlacklist.hideFilter", applyCssVariableBlacklist);
        configManager.addUpdateListener("advancedBlacklist.showOnHover", applyCssVariableBlacklist);
        configManager.addUpdateListener("advancedBlacklist.enlargeOnHover", applyCssVariableBlacklist);
        configManager.addUpdateListener("advancedBlacklist.entriesOrder", applyVariableBlacklist);

        configManager.addUpdateListener("collapsibleSidebar.enable", applyTweakCollapseSidebar);
        configManager.addUpdateListener("collapsibleSidebar.width", applyCssVariableGoCollapseSidebar);
        configManager.addUpdateListener("collapsibleSidebar.color", applyCssVariableGoCollapseSidebar);
        configManager.addUpdateListener("collapsibleSidebar.opacity", applyCssVariableGoCollapseSidebar);

        configManager.addUpdateListener("post.center", applyTweakPostCenter);
        configManager.addUpdateListener("post.fitTweaks", applyTweakPostFit);
        configManager.addUpdateListener("post.fitHorizontallyOnNarrow", applyTweakPostOnNarrow);
        configManager.addUpdateListener("post.switchFitOnClick", applyTweakPostClickSwitchFit);
        configManager.addUpdateListener("post.autoScroll", applyTweakPostAutoScroll);

        configManager.addUpdateListener("thumbs.resizeGallery", applyTweakResizeThumbsGallery);
        configManager.addUpdateListener("thumbs.resizeGallerySize", applyCssVariableGoThumbnailResize);
        configManager.addUpdateListener("thumbs.resizeMoreLikeThis", applyTweakResizeThumbsMoreLikeThis);
        configManager.addUpdateListener("thumbs.resizeMoreLikeThisSize", applyCssVariableGoThumbnailResize);
        configManager.addUpdateListener("thumbs.enlargeOnHover", applyTweakEnlargeOnHover);
        configManager.addUpdateListener("thumbs.scale", applyCssVariableGoThumbnailEnlarge);
        configManager.addUpdateListener("thumbs.highRes", applyTweakLoadHighRes);
        configManager.addUpdateListener("thumbs.loader", applyTweakLoadingIndicator);
        configManager.addUpdateListener("thumbs.removeTitle", applyTweakRemoveTitle);
        configManager.addUpdateListener("thumbs.preventOffScreen", applyTweakPreventOffScreen);
        configManager.addUpdateListener("thumbs.roundCorners", applyTweakRoundCorners);

        // configManager.addUpdateListener("api.key", applyTweakRoundCorners);
        // configManager.addUpdateListener("api.userID", applyTweakRoundCorners);

        configManager.addUpdateListener("fastDL.thumbs", applyTweakFastDL);
        configManager.addUpdateListener("fastDL.post", applyTweakFastDLPost);

        configManager.addUpdateListener("infiniteScroll.enable", applyTweakInfiniteScroll);
        configManager.addUpdateListener("infiniteScroll.paginatorOnTop", applyTweakPaginatorOnTop);
        configManager.addUpdateListener("infiniteScroll.goToTop", applyTweakGoToTop);

        configManager.addUpdateListener("darkMode.amoled", (v) => {themeManager.checkForThemeSwitch(v);});

        infiniteScrolling.addUpdateListener(e => {
            applyTweakEnlargeOnHover(Boolean(configManager.findValueByKey("thumbs.enlargeOnHover")), e);
            applyTweakLoadingIndicator(Boolean(configManager.findValueByKey("thumbs.loader")), e);
            applyTweakRoundCorners(Boolean(configManager.findValueByKey("thumbs.roundCorners")), e);
            applyTweakRemoveTitle(Boolean(configManager.findValueByKey("thumbs.removeTitle")), e);
            applyTweakFastDL(Boolean(configManager.findValueByKey("fastDL.thumbs")), e);

            applyTweakResizeThumbsGallery(Boolean(configManager.findValueByKey("thumbs.resizeGallery")), e);
            if (configManager.findValueByKey("advancedBlacklist.enable")) {
                e.forEach(e => e.parentElement.classList.add("go-blacklisted-pending"))
                blacklistManager.applyBlacklist(e);
            }
        });

        if (configManager.findValueByKey("advancedBlacklist.enable")) {
            let thumbs = utils.getThumbnails();
            if (thumbs != undefined) thumbs.forEach(e => e.parentElement.classList.add("go-blacklisted-pending"))
        }

        configManager.applyConfig();

        utils.debugLog("Registering styles");
        GM_addStyle(GM_getResourceText("css"));
    }

    // lazy fix for the back button, don't want to deal with HTML5 stuff
    window.onpopstate = function (event) {
        if (event && event.state) {
            location.reload();
        }
    };
})();
