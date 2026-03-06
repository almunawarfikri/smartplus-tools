// ==UserScript==
// @name         Disable Klik Kolom Casemix
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Mencegah klik membuka detail pasien pada kolom LOS RS, LOS BPJS dan Tarif RS
// @author       Fikri
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/disableclick.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/disableclick.user.js
// @grant        none
// ==/UserScript==

(function(){

'use strict';

function getTargetIndex(){

    let th=document.querySelectorAll("#myTable thead th");

    let index=[];

    th.forEach((h,i)=>{

        let text=h.innerText.trim();

        if(
            text==="LOS RS" ||
            text==="LOS BPJS" ||
            text==="Tarif RS"
        ){
            index.push(i);
        }

    });

    return index;

}

function blockClick(e){

    let cell = e.target.closest("td");

    if(!cell) return;

    let row = cell.parentElement;

    let cells = [...row.children];

    let index = cells.indexOf(cell);

    let targetIndex = getTargetIndex();

    if(targetIndex.includes(index)){

        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

    }

}

document.addEventListener("click", blockClick, true);
document.addEventListener("mousedown", blockClick, true);
document.addEventListener("dblclick", blockClick, true);

})();
