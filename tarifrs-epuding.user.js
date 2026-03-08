// ==UserScript==
// @name         Tarif RS SmartPlus (Instant Cache)
// @namespace    http://tampermonkey.net/
// @version      19.1
// @description  Tarif RS langsung muncul dari cache lalu update background (Optimized)
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @grant        GM_xmlhttpRequest
// @connect      192.168.3.15
// ==/UserScript==

(function(){
'use strict';

/* ================= CACHE ================= */
const CACHE_KEY = "smartplus_tarif_cache_v2";

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
    
    // 1. Bersihkan tag HTML (takutnya ada <span> atau <b> di antara Rp dan angka)
    let cleanText = html.replace(/<[^>]+>/g, " ");
    
    // 2. Cari dengan regex yang lebih toleran (mendukung "Rp", "Rp.", "Rp .")
    let match = cleanText.match(/Total biaya perawatan terbaru[\s\S]*?Rp[\s.]*([\d,.]+)/i);
    if(!match){
        match = cleanText.match(/Rp[\s.]*([\d,.]+)/i);
    }
    
    if(!match) return null;
    
    // 3. Ubah ke integer
    let angka = parseInt(match[1].replace(/[.,]/g,""), 10);
    return isNaN(angka) ? null : angka;
}

/* ================= ID REG ================= */
function idReg(url){
    if(!url) return null;
    // Mengambil string terakhir setelah garis miring (/)
    // Contoh: .../main_content/0226SA06643 -> 0226SA06643
    let segments = url.split('/');
    let id = segments.pop();
    // Jika ada parameter tambahan di URL (?id=...), bersihkan
    if (id.includes('?')) id = id.split('?')[0]; 
    return id.trim() !== "" ? id : null;
}

/* ================= FETCH ================= */
function fetchTarif(id){
    return new Promise(resolve=>{
        GM_xmlhttpRequest({
            method:"GET",
            url:`http://192.168.3.15/puding/admin/updatetarifrscasemix.php?id_reg=${id}`,
            timeout: 10000, // Tambah batas waktu agar tidak gantung
            onload:r=>resolve(r.responseText),
            onerror:()=>resolve(null),
            ontimeout:()=>resolve(null)
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
        if(!id){
            td.innerText="-";
            return;
        }

        if(cache[id]){
            td.innerText = rupiah(cache[id]);
        }else{
            td.innerText = "...";
        }
    });
}

/* ================= UPDATE BACKGROUND ================= */
async function updateTarif(){
    let rows=[...document.querySelectorAll("#myTable tbody tr")];
    
    // Diubah menjadi proses antrean berurutan (Satu per satu)
    // Untuk mencegah server lokal memblokir request karena kepenuhan
    for(let i=0; i<rows.length; i++){
        await processRow(rows[i]);
        // Jeda 200 milidetik antar request agar server bernapas
        await new Promise(r => setTimeout(r, 200)); 
    }
}

async function processRow(row){
    let td=row.querySelector(".tarif-cell");
    let link=row.querySelector("td:last-child a");
    if(!link) return;

    let id=idReg(link.href);
    if(!id) return;

    try{
        let html=await fetchTarif(id);
        if(!html) {
            if(td.innerText === "...") td.innerText = "Gagal";
            return;
        }

        let tarif=ambilTarif(html);

        if(tarif!==null){
            tarif=Math.round(tarif*1.05);
            
            if(cache[id] !== tarif){
                cache[id] = tarif;
                saveCache(cache);
                td.innerText = rupiah(tarif);
            } else if (td.innerText === "...") {
                // Jika nilai di cache sama, tapi di layar masih "..." (misal reload cache awal)
                td.innerText = rupiah(tarif);
            }
        } else {
            // Jika HTML berhasil ditarik tapi tidak ada kata "Rp" di dalamnya
            if(td.innerText === "...") td.innerText = "Tidak ada Tarif";
        }
    }catch{}
}

/* ================= INIT ================= */
function init(){
    setup();
    tampilkanCache();   // langsung tampil
    updateTarif();      // update background
}

setTimeout(init,1200);

})();
