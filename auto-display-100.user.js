// ==UserScript==
// @name         Auto Display 100 E-Ranap Smartplus
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Set show entries jadi 100 otomatis
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @match        http://192.168.3.16/smartplus/nurse_station/eranap*
// @match        http://103.83.178.90:38/smartplus/erm_ranap
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/auto-display-100.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/auto-display-100.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const interval = setInterval(() => {
        let select = document.querySelector("select[name$='_length']");

        if (select) {
            select.value = "100";
            select.dispatchEvent(new Event('change'));
            console.log("Entries diset ke 100");
            clearInterval(interval);
        }
    }, 500);

})();

