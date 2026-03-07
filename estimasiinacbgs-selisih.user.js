// ==UserScript==
// @name         SmartPlus Estimasi INA-CBG + Selisih
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/estimasiinacbgs-selisih.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/estimasiinacbgs-selisih.user.js

// @grant        none
// ==/UserScript==

(function(){

'use strict';

/* ================= MAP INA CBG ================= */

const inacbgTarif = [

{ keywords: ["tb paru level 2"], tarif: 5234900 },
{ keywords: ["tb paru","tb","tbc"], tarif: 4381700 },
{ keywords: ["tb dih"], tarif: 3419900 },
{ keywords: ["bekas tb"], tarif: 4226800 },
  
{ keywords: ["bp level 2","bronchopneumonia level 2"], tarif: 4696200 },
{ keywords: ["bp","bronchopneumonia","broncho","pneumonia"], tarif: 2915200 },
{ keywords: ["bronchitis akut","acute bronchitis"], tarif: 2915200 },  

{ keywords: ["asma level 2", "ppok level 2"], tarif: 3093400 },
{ keywords: ["asma", "ppok"], tarif: 2249100 },

{ keywords: ["stroke level 2","cerebral infark level 2"], tarif: 5540700 },
{ keywords: ["stroke","cerebral infark","snh"], tarif: 4077800 },
{ keywords: ["stroke lama", "stroke iskemik lama", "sequele stroke"], tarif: 3242600 },
{ keywords: ["stroke lama level 2", "stroke iskemik lama level 2", "sequele stroke level 2" ], tarif: 3772100 },  
{ keywords: ["migrain vestibular", "migrain"], tarif: 2155900 },
  
{ keywords: ["stemi"], tarif: 3509100 },
{ keywords: ["uap","unstable angina"], tarif: 3633300 },
{ keywords: ["chf"], tarif: 2867100 },
{ keywords: ["chf level 2"], tarif: 3387500 },
{ keywords: ["af level 2"], tarif: 4971100 },
{ keywords: ["hhd"], tarif: 2119000 },

{ keywords: ["isk","infeksi saluran kemih"], tarif: 2479100 },
{ keywords: ["ispa"], tarif: 2000700 },
{ keywords: ["df","dhf","df dhf", "dengue fever"], tarif: 1959100 },

{ keywords: ["dm","hiperglikemia"], tarif: 3648700 },
{ keywords: ["hypoglikemia"], tarif: 3648700 },

{ keywords: ["abses + dm"], tarif: 3648700 },
{ keywords: ["abses + dm level 2"], tarif: 4797000 },
{ keywords: ["abses"], tarif: 1659600 },

{ keywords: ["abdominal pain","abd pain", "vi", "viral infection"], tarif: 1652000 },
{ keywords: ["dadrs", "dads", "dyspepsia","bii","bi", "Cyclic Vomiting", "Diarrhoea And Gastroenteritis", "Bacterial Intestinal Infection", "bacterial infection"], tarif: 1361300 },
{ keywords: ["hematemesis"], tarif: 1361300 },
{ keywords: ["melena anemia"], tarif: 1934300 },

{ keywords: ["vertigo","bppv"], tarif: 1436900 },
{ keywords: ["convulsion","kds"], tarif: 2766600 },

{ keywords: ["ckd"], tarif: 3043000 },
{ keywords: ["hidronefrosis"], tarif: 3581900 },

{ keywords: ["lbp"], tarif: 3000100 },
{ keywords: ["morbili", "Measles"], tarif: 1959100 },
{ keywords: ["appendicitis acute", "App", "App Akut], tarif: 3668500 },
{ keywords: ["ht"], tarif: 2119000 },             
{ keywords: ["dvt"], tarif: 4668700 }

];

/* ================= KOMORBID LEVEL 2 ================= */

const komorbidLevel2=[
"anemia",
"hipoelektrolit",
"hiponatremia",
"hipokalemia",
"chf"
];

/* ================= FUNCTIONS ================= */

function normalize(text){

return (text||"").toLowerCase().replace(/[^\w\s]/g,"").trim();

}

function rupiah(n){

if(!n) return "-";

return "Rp "+n.toLocaleString("id-ID");

}

/* ================= AMBIL DIAGNOSA UTAMA ================= */

function diagnosaUtama(text){

if(!text) return "";

return text.split(";")[0].trim();

}

/* ================= CEK LEVEL 2 ================= */

function cekLevel2(text){

let diag=text.toLowerCase().split(";");

if(diag.length<2) return false;

for(let i=1;i<diag.length;i++){

for(let komorbid of komorbidLevel2){

if(diag[i].includes(komorbid)){
return true;
}

}

}

return false;

}

/* ================= CARI TARIF INA ================= */

function findTarifINA(diagnosa){

let utama=normalize(diagnosaUtama(diagnosa));

let level2=cekLevel2(diagnosa);

/* cek level 2 */

if(level2){

for(let item of inacbgTarif){

for(let key of item.keywords){

if(!key.includes("level 2")) continue;

let regex=new RegExp("\\b"+normalize(key)+"\\b","i");

if(regex.test(utama)){
return item.tarif;
}

}

}

}

/* cek normal */

for(let item of inacbgTarif){

for(let key of item.keywords){

if(key.includes("level 2")) continue;

let regex=new RegExp("\\b"+normalize(key)+"\\b","i");

if(regex.test(utama)){
return item.tarif;
}

}

}

return 0;

}

/* ================= SCRIPT UTAMA ================= */

function init(){

let table=document.querySelector("#myTable");

if(!table) return;

let headers=table.querySelectorAll("thead th");

let tarifIndex=-1;
let actionIndex=-1;

headers.forEach((th,i)=>{

if(th.innerText.includes("Tarif RS")) tarifIndex=i;

if(th.innerText.includes("Action")) actionIndex=i;

});

if(tarifIndex===-1) return;

/* tambah header */

let thINA=document.createElement("th");
thINA.innerText="Estimasi INA-CBG";

let thSel=document.createElement("th");
thSel.innerText="Selisih";

headers[actionIndex].before(thINA);
headers[actionIndex].before(thSel);

/* isi tabel */

let rows=table.querySelectorAll("tbody tr");

rows.forEach(row=>{

let cells=row.querySelectorAll("td");

let diagnosa=cells[6].innerText;

let tarifRS=parseInt(cells[tarifIndex].innerText.replace(/[^\d]/g,""))||0;

let estimasi=findTarifINA(diagnosa);

let selisih=estimasi-tarifRS;

/* estimasi */

let tdINA=document.createElement("td");
tdINA.innerText=rupiah(estimasi);

/* selisih */

let tdSel=document.createElement("td");
tdSel.innerText=rupiah(selisih);

if(selisih<0){

tdSel.style.background="#d50000";
tdSel.style.color="white";

}else{

tdSel.style.background="#2e7d32";
tdSel.style.color="white";

}

cells[actionIndex].before(tdINA);
cells[actionIndex].before(tdSel);

});

}

setTimeout(init,1500);

})();
