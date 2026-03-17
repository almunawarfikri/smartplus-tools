// ==UserScript==
// @name         Tarif RS SmartPlus (Ultra Fast Parallel)
// @namespace    http://tampermonkey.net/
// @version      27.0
// @description  Ambil Tarif RS SMARTHIS super cepat (5 paralel + cache)
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @match        http://192.168.3.16/smartplus/nurse_station/eranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @grant        GM_xmlhttpRequest
// @connect      192.168.3.15
// ==/UserScript==

(function(){

'use strict';

const CACHE_KEY = "smartplus_tarif_cache_v7";
const AUTH_KEY = "epuding_auth_v1";
const MAX_PARALLEL = 4;

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
let isLoggingIn = false;

/* ================= FORMAT ================= */

function rupiah(n){
    if(!n) return "-";
    return "Rp " + n.toLocaleString("id-ID");
}


/* ================= PARSER ================= */

function ambilTarif(html){

    if(!html) return null;

    let match = html.match(/id="tarifsmarthis"[^>]*value="([^"]+)"/i);

    if(!match) return null;

    let angka = match[1]
        .replace(/Rp/i,"")
        .replace(/\./g,"")
        .replace(/,/g,"")
        .replace(/[^0-9]/g,"");

    return parseInt(angka,10);
}


/* ================= AUTH ================= */

function getAuth(){
    try{
        return JSON.parse(localStorage.getItem(AUTH_KEY));
    }catch{
        return null;
    }
}

function saveAuth(uname, pass){
    localStorage.setItem(AUTH_KEY, JSON.stringify({uname, pass}));
}

async function performLogin(){

    if(isLoggingIn){
        while(isLoggingIn){
            await new Promise(r => setTimeout(r, 500));
        }
        return true;
    }

    isLoggingIn = true;

    let auth = getAuth();
    if(!auth){
        let uname = prompt("Masukkan Username E-Puding:");
        let pass = prompt("Masukkan Password E-Puding:");
        if(uname && pass){
            saveAuth(uname, pass);
            auth = {uname, pass};
        }else{
            isLoggingIn = false;
            return false;
        }
    }

    console.log("Mencoba login otomatis ke E-Puding...");

    return new Promise(resolve=>{
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://192.168.3.15/puding/admin/login_act.php",
            data: `uname=${encodeURIComponent(auth.uname)}&pass=${encodeURIComponent(auth.pass)}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: 10000,
            onload: r => {
                isLoggingIn = false;
                console.log("Login E-Puding Berhasil");
                resolve(true);
            },
            onerror: () => {
                isLoggingIn = false;
                console.error("Login E-Puding Gagal (Network Error)");
                resolve(false);
            },
            ontimeout: () => {
                isLoggingIn = false;
                console.warn("Login E-Puding Gagal (Timeout)");
                resolve(false);
            }
        });
    });
}


/* ================= FETCH ================= */

function fetchTarif(id){

    return new Promise(resolve=>{

        GM_xmlhttpRequest({

            method:"GET",

            url:`http://192.168.3.15/puding/admin/updatetarifrscasemix.php?id_reg=${id}`,

            timeout:15000,

            onload:r=>resolve(r.responseText),

            onerror:()=>resolve(null),

            ontimeout:()=>resolve(null)

        });

    });

}


/* ================= ID REG ================= */

function idReg(url){
    let m = url.match(/([0-9]{4}[A-Z]{2}[0-9]+)/);
    return m ? m[1] : "";
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


/* ================= INIT CELL ================= */

function initCells(){

    let rows=[...document.querySelectorAll("#myTable tbody tr")];

    rows.forEach(row=>{

        let td=row.querySelector(".tarif-cell");

        if(!td){

            td=document.createElement("td");

            td.className="tarif-cell";

            row.querySelector("td:last-child").before(td);

        }

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


/* ================= PROCESS ONE ================= */

async function processRow(row){

    let td=row.querySelector(".tarif-cell");

    let link=row.querySelector("td:last-child a");

    if(!link) return;

    let id=idReg(link.href);

    if(cache[id]){
        td.innerText=rupiah(cache[id]);
        return;
    }

    console.log(`Mengambil tarif untuk ID: ${id}...`);
    let html=await fetchTarif(id);

    // Cek apakah butuh login
    if(html && html.includes("Login E-Puding")){
        console.warn(`Sesi habis saat mengambil ID: ${id}, mencoba login ulang...`);
        let success = await performLogin();
        if(success){
            html = await fetchTarif(id);
        }
    }

    let tarif=ambilTarif(html);

    if(tarif===null && html && !html.includes("Login E-Puding")){
        // Retry sekali lagi jika gagal ambil tarif tapi html ada (bukan login page)
        console.log(`Gagal parsing ID: ${id}, mencoba ulang...`);
        let retry=await fetchTarif(id);
        tarif=ambilTarif(retry);
    }

    if(tarif!==null){
        tarif=Math.round(tarif*1.05);
        cache[id]=tarif;
        saveCache(cache);
        td.innerText=rupiah(tarif);
    }else{
        console.error(`Tarif ID: ${id} Gagal total. (HTML: ${html ? html.length : 0} bytes)`);
        td.innerText="-";
    }
}


/* ================= PARALLEL QUEUE ================= */

async function runParallel(rows){

    let index=0;

    async function worker(){

        while(index < rows.length){

            let row=rows[index++];

            await processRow(row);
        }
    }

    let workers=[];

    for(let i=0;i<MAX_PARALLEL;i++){

        workers.push(worker());
    }

    await Promise.all(workers);
}


/* ================= UPDATE ================= */

async function updateTarif(){

    let rows=[...document.querySelectorAll("#myTable tbody tr")];

    await runParallel(rows);
}


/* ================= INIT ================= */

function init(){

    setup();

    initCells();

    updateTarif();
}

setTimeout(init,1200);

})();
