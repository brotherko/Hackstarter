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
        state: {
            chosen_pledge: 0,
            pledges: []
        },

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

        initState: function() {
            $(".pledge-page-rewards > .pledge-selectable:not(.pledge--no-reward)").each(function(i, k) {
                // kh.state.pledges.push{}
                var pledge = {
                    id: $(this).find(".pledge__radio").attr("value"),
                    name: $(this).find(".pledge__title").text(),
                    amount: $(this).find(".pledge__amount").text()
                };
                if ($(this).hasClass("pledge--backed")) {
                    kh.state.chosen_pledge = pledge;
                } else {
                    kh.state.pledges.push(pledge);
                }
            })
            kh.debug("Init state - done", kh.state);
        },

        initParam: function() {
            kh.param.execute = (kh.storage.get("execute") == null) ? false : (kh.storage.get("execute"));
            kh.param.options = (kh.storage.get("options") == null) ? [] : (kh.storage.get("options"));
            kh.debug(kh.param);
        },

        refresher: function() {

            if (kh.param.execute == true) {
                $("body").prepend('<div class="kh_refresher_stop" style="z-index: 9999; position: fixed; height: 100%; width: 100%; background: rgba(255, 255, 255, 0.5); color: #25cb68; font-size: 20pt; font-weight: bold; padding: 30px">Click on anywhere to stop ... </div>');
                var count = 0;
                $.each(kh.param.options, function(i, k) {
                    if (!($("#backing_backer_reward_id_" + k).next().find(".pledge__limit--all-gone").length >= 1)) {
                        kh.storage.update("execute", false);
                        kh.action(k);
                        return false;
                    }
                    count++;
                    if (count == kh.param.options.length) {
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
                $("#sidebar").append('<div class="NS_pledges__checkout_accountability important-notice kh_panel"><h6 class="important"><span class="highlight">Kickstarter Helper</span></h6><span class="important__subhead">Your Chosen Pledge</span><div class="kh_chosen_pledge"><p>- ' + kh.state.chosen_pledge.name + ' | ' + kh.state.chosen_pledge.amount + '</p></div><span class="important__subhead">Your ideal pledges:</span><div class="kn_ideal_pledges"></div><p class="kh_execute"><button class="btn btn--green kh_execute_btn">Execute</button></div></p></div>');
                $(".kh_execute_btn").on("click", function() {
                    kh.storage.update("execute", true);
                    kh.refresher();
                });
                kh.panel.update();
            },
            update: function() {
                var temp = "";
                kh.param.options.map(function(id) {
                    var pledge = kh.state.pledges.filter(function(i) {
                        return i.id == id;
                    })[0];
                    temp = temp + '<p>- ' + pledge.name + ' | ' + pledge.amount + '</p>';

                });
                $(".kn_ideal_pledges").html(temp);
            }
        },

        addBtn: function() {
            $(".pledge-page-rewards > .pledge-selectable:not(.pledge--no-reward, .pledge--backed)").each(function(k, n) {
                var pid = $(this).find(".pledge__radio").attr("value");
                if ((dev ? true : $(this).find(".pledge__limit").hasClass("pledge__limit--all-gone"))) {
                    $(this).find(".pledge__backer-stats").append('<div class="pledge__limit kh_select" style="background-color: #e0e4fb; border-radius: 0.66667px; color: #020621;font-weight: bold; padding: 2px 6px;">Get me in!<input type="checkbox" name="pledge__extra-options" value="' + pid + '" /></div>');
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
            kh.initState();
            kh.addBtn();
            kh.panel.init();
        }

    };

    kh.main();
})();
