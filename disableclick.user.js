// ==UserScript==
// @name         Disable Klik Kolom Casemix
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Hanya kolom Action yang bisa diklik, tapi text masih bisa dicopy
// @author       Fikri
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/disableclick.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/disableclick.user.js
// @grant        none
// ==/UserScript==

(function(){

'use strict';

function getActionIndex(){

    let th = document.querySelectorAll("#myTable thead th");

    let actionIndex = -1;

    th.forEach((h,i)=>{

        let text = h.innerText.trim();

        if(text === "Action"){
            actionIndex = i;
        }

    });

    return actionIndex;

}

function blockClick(e){

    let cell = e.target.closest("td");

    if(!cell) return;

    let row = cell.parentElement;

    let cells = [...row.children];

    let index = cells.indexOf(cell);

    let actionIndex = getActionIndex();

    if(index !== actionIndex){

        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

    }

}

// hanya blok klik saja
document.addEventListener("click", blockClick, true);
document.addEventListener("dblclick", blockClick, true);

})();
