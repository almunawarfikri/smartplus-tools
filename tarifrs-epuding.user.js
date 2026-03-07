// ==UserScript==
// @name         Tarif RS
// @namespace    http://tampermonkey.net/
// @version      16.0
// @description  Tarik Tarif RS dari Puding (lebih cepat)
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/tarifrs-epuding.user.js
// @grant        GM_xmlhttpRequest
// @connect      192.168.3.15
// ==/UserScript==

(function(){

'use strict';


/* ================= FORMAT RUPIAH ================= */

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


/* ================= AMBIL ID REG ================= */

function idReg(url){

    let m=url.match(/([0-9]{4}[A-Z]{2}[0-9]+)/i);

    return m ? m[1] : null;

}


/* ================= FETCH TARIF ================= */

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


/* ================= TAMBAH HEADER ================= */

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

    td.innerText="...";

    row.querySelector("td:last-child").before(td);

    let link=row.querySelector("td:last-child a");

    if(!link){

        td.innerText="-";

        return;

    }

    try{

        let id=idReg(link.href);

        if(!id){

            td.innerText="-";

            return;

        }

        let html=await fetchTarif(id);

        if(!html){

            td.innerText="-";

            return;

        }

        let tarif=ambilTarif(html);

        if(tarif!==null){

            tarif=Math.round(tarif*1.05);

        }

        td.innerText=rupiah(tarif);

    }catch{

        td.innerText="-";

    }

}


/* ================= RUN (PARALLEL + BATCH) ================= */

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
