// ==UserScript==
// @name         Disable Klik Kolom Casemix
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Hanya kolom Action yang bisa diklik pada tabel pasien
// @author       Fikri
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/disableclick.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/disableclick.user.js
// @grant        none
// ==/UserScript==

(function(){

'use strict';


/* hanya aktif jika tabel pasien ada */
function isCasemixTable(){

    return document.querySelector("#myTable");

}


function getActionIndex(){

    let th=document.querySelectorAll("#myTable thead th");

    let actionIndex=-1;

    th.forEach((h,i)=>{

        let text=h.innerText.trim();

        if(text==="Action"){

            actionIndex=i;

        }

    });

    return actionIndex;

}


function blockClick(e){

    if(!isCasemixTable()) return;

    let cell=e.target.closest("td");

    if(!cell) return;

    let row=cell.parentElement;

    let cells=[...row.children];

    let index=cells.indexOf(cell);

    let actionIndex=getActionIndex();

    if(index!==actionIndex){

        e.stopImmediatePropagation();

        e.stopPropagation();

        e.preventDefault();

    }

}


document.addEventListener("click",blockClick,true);

document.addEventListener("dblclick",blockClick,true);

})();
