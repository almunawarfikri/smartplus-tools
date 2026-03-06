// ==UserScript==
// @name         Auto Display 100 E-Ranap Smartplus
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Set show entries jadi 100 otomatis
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-losrsbpjs/main/auto-display-100.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-losrsbpjs/main/auto-display-100.user.js
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
