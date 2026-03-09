// ==UserScript==
// @name         SmartPlus LOS RS & BPJS
// @namespace    http://tampermonkey.net/
// @version      15.4
// @description  LOS RS + LOS BPJS + cache + fast + sort
// @match        http://103.83.178.90:38/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/los-smartplus.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/los-smartplus.user.js
// @grant        none
// ==/UserScript==

(function () {
'use strict';

const CACHE_KEY = "smartplus_cache_los";

/* ================= CACHE ================= */

function getCache(){
    return JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");
}

function saveCache(cache){
    localStorage.setItem(CACHE_KEY,JSON.stringify(cache));
}

/* ================= HITUNG LOS RS ================= */

function hitungLOS(tgl){

    let start=new Date(tgl.replace(" ","T"));
    let now=new Date();
    let diff=now-start;

    let hari=Math.floor(diff/(1000*60*60*24));
    let jam=Math.floor((diff%(1000*60*60*24))/(1000*60*60));

    return {text:`${hari} Hari ${jam} Jam`,hari};
}

/* ================= HITUNG LOS BPJS ================= */

function hitungLOSBPJS(tgl){

    let s=new Date(tgl.replace(" ","T"));
    let n=new Date();

    let sd=new Date(s.getFullYear(),s.getMonth(),s.getDate());
    let nd=new Date(n.getFullYear(),n.getMonth(),n.getDate());

    return Math.floor((nd-sd)/(1000*60*60*24))+1;
}

/* ================= AMBIL WAKTU REGISTRASI ================= */

function ambilWaktuRegistrasi(html){

    let doc=new DOMParser().parseFromString(html,"text/html");

    let labels=doc.querySelectorAll("label");

    for(let l of labels){
        if(l.innerText.includes("Waktu Registrasi")){
            let v=l.parentElement.querySelector(".col-sm-9");
            return v? v.innerText.replace(":","").trim() : null;
        }
    }

    return null;
}

/* ================= WARNA LOS ================= */

function warnaCell(cell,hari){

    cell.style.background="";
    cell.style.color="";
    cell.style.fontWeight="";

    if(hari>=5){
        cell.style.background="#d50000";
        cell.style.color="white";
        cell.style.fontWeight="bold";
    }
    else if(hari===4){
        cell.style.background="#ff9800";
        cell.style.color="white";
    }
}

/* ================= SETUP KOLOM ================= */

function setupColumns(){

    let headers=document.querySelectorAll("#myTable thead th");
    let rsIndex=-1;

    for(let i=0;i<headers.length;i++){

        if(headers[i].innerText.trim()==="Alamat"){

            headers[i].innerText="LOS RS";
            rsIndex=i;
            break;
        }
    }

    if(rsIndex===-1) return null;

    if(!document.querySelector(".losbpjs-header")){

        let th=document.createElement("th");
        th.innerText="LOS BPJS";
        th.className="losbpjs-header";

        headers[rsIndex].after(th);
    }

    return rsIndex;
}

/* ================= TAMPILKAN DATA ================= */

function tampilkan(data,rsCell,bpjsCell){

    let los=hitungLOS(data.tgl);
    let losBPJS=hitungLOSBPJS(data.tgl);

    rsCell.innerText=los.text;
    rsCell.setAttribute("data-order",los.hari);

    bpjsCell.innerText=losBPJS+" Hari";
    bpjsCell.setAttribute("data-order",losBPJS);

    warnaCell(rsCell,los.hari);
}

/* ================= PROSES ROW ================= */

async function proses(rsIndex){

    let cache=getCache();
    let rows=document.querySelectorAll("#myTable tbody tr");
    let jobs=[];

    for(let row of rows){

        let cells=row.querySelectorAll("td");
        if(!cells[rsIndex]) continue;

        if(!row.querySelector(".losbpjs-cell")){

            let td=document.createElement("td");
            td.className="losbpjs-cell";

            cells[rsIndex].after(td);
        }

        let rsCell=row.querySelectorAll("td")[rsIndex];
        let bpjsCell=row.querySelector(".losbpjs-cell");

        let link=row.querySelector("td:last-child a");
        if(!link) continue;

        let key=link.href;

        if(cache[key]){

            tampilkan(cache[key],rsCell,bpjsCell);
            continue;
        }

        rsCell.innerText="Loading...";
        bpjsCell.innerText="...";

        jobs.push(

            fetch(link.href)

            .then(r=>r.text())

            .then(html=>{

                let tgl=ambilWaktuRegistrasi(html);

                if(!tgl){

                    rsCell.innerText="-";
                    bpjsCell.innerText="-";
                    return;
                }

                cache[key]={tgl};
                saveCache(cache);

                tampilkan(cache[key],rsCell,bpjsCell);
            })

            .catch(()=>{

                rsCell.innerText="-";
                bpjsCell.innerText="-";
            })
        );
    }

    await Promise.all(jobs);
}

/* ================= INIT ================= */

function init(){

    let rsIndex=setupColumns();

    if(rsIndex===null) return;

    proses(rsIndex);
}

setTimeout(init,2000);

})();

