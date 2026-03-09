// ==UserScript==
// @name         Tarif RS SmartPlus (Ultra Fast Cache)
// @namespace    http://tampermonkey.net/
// @version      20.0
// @description  Tarif RS instant cache + parallel fetch + retry system
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @grant        GM_xmlhttpRequest
// @connect      192.168.3.15
// ==/UserScript==

(function(){
'use strict';

/* ================= CONFIG ================= */

const CACHE_KEY = "smartplus_tarif_cache_v3";
const MAX_PARALLEL = 6;     // jumlah request bersamaan
const RETRY = 3;            // retry jika gagal

/* ================= CACHE ================= */

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

    if(!html) return null;

    let clean = html.replace(/<[^>]+>/g," ");

    let match = clean.match(/Rp\s*([\d.,]+)/i);

    if(!match) return null;

    let angka = parseInt(match[1].replace(/[.,]/g,""),10);

    return isNaN(angka) ? null : angka;
}

/* ================= ID REG ================= */

function idReg(url){

    let parts=url.split("/");
    let id=parts.pop();

    if(id.includes("?")) id=id.split("?")[0];

    return id;
}

/* ================= FETCH ================= */

function fetchTarif(id){

    return new Promise(resolve=>{

        GM_xmlhttpRequest({

            method:"GET",

            url:`http://192.168.3.15/puding/admin/updatetarifrscasemix.php?id_reg=${id}`,

            timeout:8000,

            onload:r=>resolve(r.responseText),

            onerror:()=>resolve(null),

            ontimeout:()=>resolve(null)

        });

    });
}

/* ================= RETRY ================= */

async function fetchRetry(id){

    for(let i=0;i<RETRY;i++){

        let html=await fetchTarif(id);

        if(html) return html;
    }

    return null;
}

/* ================= HEADER ================= */

function setup(){

    if(document.querySelector(".tarif-header")) return;

    let th=document.querySelectorAll("#myTable thead th");

    let t=document.createElement("th");

    t.innerText="Tarif RS";

    t.className="tarif-header";

    th[th.length-1].before(t);
}

/* ================= TAMPILKAN CACHE ================= */

function tampilkanCache(){

    let rows=[...document.querySelectorAll("#myTable tbody tr")];

    rows.forEach(row=>{

        let td=document.createElement("td");

        td.className="tarif-cell";

        row.querySelector("td:last-child").before(td);

        let link=row.querySelector("td:last-child a");

        if(!link){
            td.innerText="-";
            return;
        }

        let id=idReg(link.href);

        if(cache[id]){

            td.innerText=rupiah(cache[id]);

        }else{

            td.innerText="...";
        }

    });

}

/* ================= PROCESS ROW ================= */

async function processRow(row){

    let td=row.querySelector(".tarif-cell");

    let link=row.querySelector("td:last-child a");

    if(!link) return;

    let id=idReg(link.href);

    if(!id) return;

    /* skip jika cache ada */

    if(cache[id]) return;

    let html=await fetchRetry(id);

    if(!html){

        td.innerText="Gagal";

        return;
    }

    let tarif=ambilTarif(html);

    if(tarif!==null){

        tarif=Math.round(tarif*1.05);

        cache[id]=tarif;

        saveCache(cache);

        td.innerText=rupiah(tarif);

    }else{

        td.innerText="Tidak ada";
    }
}

/* ================= WORKER ================= */

async function worker(queue){

    while(queue.length){

        let row=queue.shift();

        await processRow(row);
    }
}

/* ================= UPDATE ================= */

async function updateTarif(){

    let rows=[...document.querySelectorAll("#myTable tbody tr")];

    let queue=[...rows];

    let workers=[];

    for(let i=0;i<MAX_PARALLEL;i++){

        workers.push(worker(queue));
    }

    await Promise.all(workers);
}

/* ================= INIT ================= */

function init(){

    setup();

    tampilkanCache();

    updateTarif();
}

setTimeout(init,1200);

})();
