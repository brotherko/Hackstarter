// ==UserScript==
// @name         Kickstarter Pledge Finder
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  try to take over the world!
// @author       You
// @match        https://www.kickstarter.com/projects/*/*/pledge/edit
// @require http://code.jquery.com/jquery-latest.js
// @grant   GM_getValue
// @grant   GM_setValue
// @grant   GM_addStyle
// ==/UserScript==

(function() {

    var dev = true;
    var kh = {

        param: {
            execute: false,
            options: []
        },

        debug: function(msg, p) {
            if (dev == true) {
                console.log(msg, p);
            }
        },

        storage: {
            update: function(name, val) {
                GM_setValue(name, JSON.stringify(val));
                kh.param[name] = val;
                kh.debug("Saved", kh.param);
            },

            get: function(name) {
                return JSON.parse(GM_getValue(name));
            }
        },

        initParam: function() {
            kh.param.execute = (kh.storage.get("execute") == null) ? false : (kh.storage.get("execute"));
            kh.param.options = (kh.storage.get("options") == null) ? [] : (kh.storage.get("options"));
            kh.debug(kh.param);
        },

        refresher: function() {
            kh.debug(kh.param);
            if (kh.param.execute == true) {
                var count = 0;
                $.each(kh.param.options, function(i, k) {
                    if (!($("#backing_backer_reward_id_" + k).next().find(".pledge__limit--all-gone").length >= 1)) {
                        kh.storage.update("execute", false);
                        kh.action(k);
                        return false;
                    }
                    count++;
                    if (count == kh.param.options.length) {
                        $("body").prepend('<div class="kh_refresher_stop" style="z-index: 9999;position: fixed; height: 100%; width: 100%; background: rgba(0, 0, 0, 0.3); color: #FFF; font-size: 15pt">Click on anywhere to stop ... </div>');
                        $(".kh_refresher_stop").on("click", function(a, b) {
                            kh.storage.update("execute", false);
                            $(this).remove();
                        })
                        kh.debug("Not reworking. reload");
                        location.reload();
                    }
                });
            }
        },

        action: function(rewardId) {
            kh.debug(rewardId, $(".backing_backer_reward_id_" + rewardId));
            $("#backing_backer_reward_id_" + rewardId).parent().find(".pledge__checkout button.pledge__checkout-submit").click();
            $(".js-confirm-yes")[0].click();

        },

        panel: {
            init: function() {
                $("#sidebar").append('<div class="NS_pledges__checkout_accountability important-notice kh_panel"><h6 class="important"><span class="highlight">Kickstarter Helper</span></h6><p class="kh_view_options">Your chosen pledge: ' + kh.param.options.toString() + '</p><p class="kh_execute"><button class="btn btn--green kh_execute_btn">Execute</button></div></p></div>');
                $(".kh_execute_btn").on("click", function() {
                    kh.storage.update("execute", true);
                    kh.refresher();
                });
            },
            update: function() {
                $(".kh_view_options").html('Your chosen pledge:' + kh.param.options.toString());
            }
        },

        addBtn: function() {
            $(".pledge-page-rewards > li").each(function(k, n) {
                var pid = $(this).find(".pledge__radio").attr("value");
                if ((dev ? true : $(this).find(".pledge__limit").hasClass("pledge__limit--all-gone"))) {
                    $(this).find(".pledge__backer-stats").append('<div class="pledge__limit kh_select" style="background-color: #e0e4fb; border-radius: 0.66667px; color: #020621;font-weight: bold; padding: 2px 6px;">Notify me <input type="checkbox" name="pledge__extra-options" value="' + pid + '" /></div>');
                }
            });

            $("input[name='pledge__extra-options']").on("change", function(a, b) {
                kh.param.options = [];
                $("input[name='pledge__extra-options']:checked").each(function(c, d) {
                    kh.param.options.push($(this).val());
                });
                kh.panel.update();
                kh.storage.update("options", kh.param.options);
            });
        },

        main: function() {
            kh.initParam();
            kh.refresher();
            kh.panel.init();
            kh.addBtn();
        }

    };

    kh.main();
})();
