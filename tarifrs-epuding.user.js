// ==UserScript==
// @name         Tarif RS
// @namespace    http://tampermonkey.net/
// @version      17.0
// @description  Tarif RS dengan cache lokal (lebih cepat)
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @grant        GM_xmlhttpRequest
// @connect      192.168.3.15
// ==/UserScript==

(function(){

'use strict';


/* ================= CACHE ================= */

const CACHE_KEY = "smartplus_tarif_cache";

function loadCache(){

    try{

        return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};

    }catch{

        return {};

    }

}

function saveCache(data){

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));

}

let cache = loadCache();


/* ================= FORMAT ================= */

function rupiah(n){

    if(!n) return "-";

    return "Rp " + n.toLocaleString("id-ID");

}


/* ================= AMBIL TARIF ================= */

function ambilTarif(html){

    let match = html.match(/Total biaya perawatan terbaru[\s\S]*?Rp\s*([\d,.]+)/i);

    if(!match){

        match = html.match(/Rp\s*([\d,.]+)/i);

    }

    if(!match) return null;

    return parseInt(match[1].replace(/[.,]/g,""));

}


/* ================= ID REG ================= */

function idReg(url){

    let m=url.match(/([0-9]{4}[A-Z]{2}[0-9]+)/i);

    return m ? m[1] : null;

}


/* ================= FETCH ================= */

function fetchTarif(id){

    return new Promise(resolve=>{

        GM_xmlhttpRequest({

            method:"GET",

            url:`http://192.168.3.15/puding/admin/updatetarifrscasemix.php?id_reg=${id}`,

            onload:r=>resolve(r.responseText),

            onerror:()=>resolve(null)

        });

    });

}


/* ================= HEADER ================= */

function setup(){

    let th=document.querySelectorAll("#myTable thead th");

    if(document.querySelector(".tarif-header")) return;

    let t=document.createElement("th");

    t.innerText="Tarif RS";

    t.className="tarif-header";

    th[th.length-1].before(t);

}


/* ================= PROCESS ROW ================= */

async function processRow(row){

    if(row.querySelector(".tarif-cell")) return;

    let td=document.createElement("td");

    td.className="tarif-cell";

    row.querySelector("td:last-child").before(td);

    let link=row.querySelector("td:last-child a");

    if(!link){

        td.innerText="-";

        return;

    }

    let id=idReg(link.href);

    if(!id){

        td.innerText="-";

        return;

    }


    /* tampilkan cache dulu */

    if(cache[id]){

        td.innerText = rupiah(cache[id]);

    }else{

        td.innerText = "...";

    }


    /* fetch update */

    try{

        let html=await fetchTarif(id);

        if(!html) return;

        let tarif=ambilTarif(html);

        if(tarif!==null){

            tarif=Math.round(tarif*1.05);

        }

        if(!tarif) return;


        /* jika tarif berubah */

        if(cache[id] !== tarif){

            cache[id] = tarif;

            saveCache(cache);

            td.innerText = rupiah(tarif);

        }

    }catch{}

}


/* ================= RUN ================= */

async function run(){

    let rows=[...document.querySelectorAll("#myTable tbody tr")];

    let batch=5;

    for(let i=0;i<rows.length;i+=batch){

        let slice=rows.slice(i,i+batch);

        await Promise.all(slice.map(processRow));

    }

}


/* ================= INIT ================= */

function init(){

    setup();

    run();

}

setTimeout(init,1500);

})();
