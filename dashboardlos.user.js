// ==UserScript==
// @name         Dashboard TKMKB
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Dashboard LOS RS + ALOS RS + BOR + LOS Tinggi + Dokter + Export CSV
// @author       Fikri
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/dashboardlos.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/dashboardlos.user.js
// @grant        none
// ==/UserScript==

(function() {
'use strict';

    /* ================= AUTO HIDE SIDEBAR ================= */

function hideSidebar(){

const toggle=document.querySelector(".sidebartoggler");

if(toggle){
toggle.click();
}

}

setTimeout(hideSidebar,1000);

/* ================= STYLE ================= */

const style = `
#dashboardPasien{
background:#fff;
border:1px solid #ccc;
padding:12px;
margin-bottom:10px;
font-family:sans-serif;
font-size:14px;
border-radius:6px;
line-height:1.6;
}

.dot{
height:12px;
width:12px;
border-radius:50%;
display:inline-block;
margin-right:4px;
}

.hijau{background:#4caf50;}
.orange{background:#ff9800;}
.merah{background:#d50000;}

.badge{
background:#1976d2;
color:white;
padding:2px 7px;
border-radius:4px;
margin-left:4px;
font-size:12px;
}

.bor-highlight{
background:#1976d2;
color:white;
padding:2px 6px;
border-radius:4px;
font-weight:bold;
}

.btn-export{
background:#217346;
color:white;
border:none;
padding:5px 10px;
border-radius:4px;
font-size:12px;
cursor:pointer;
margin-left:10px;
}

.los-box{
margin-top:10px;
background:#fff8e1;
border-left:4px solid #ff9800;
padding:8px 10px;
border-radius:4px;
}

.los-header{
font-weight:bold;
cursor:pointer;
margin-bottom:6px;
}

.los-header::after{content:" ▶";font-size:12px;}
.los-header.open::after{content:" ▼";}

.los-item{
padding:6px 0;
border-bottom:1px dashed #ccc;
}

.los-diagnosa{
font-size:12px;
color:#555;
margin-top:2px;
}

.hidden{display:none;}
`;

document.head.appendChild(Object.assign(document.createElement("style"),{innerHTML:style}));

/* ================= FORMAT ================= */

function formatRupiah(n){
let sign=n<0?"-":"";
let formatted=Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
return "Rp "+sign+formatted;
}

/* ================= AMBIL LOS ================= */

function ambilLOS(text){

const hari=text.match(/(\d+)\s*Hari/i);
const jam=text.match(/(\d+)\s*Jam/i);

let h=hari?parseInt(hari[1]):0;
let j=jam?parseInt(jam[1]):0;

return h + (j/24);

}

/* ================= RUANGAN ================= */

function getRuangan(cells){

const ruangCell=cells.find(c=>
c.innerText.includes("RPU") ||
c.innerText.includes("ICU") ||
c.innerText.includes("HCU") ||
c.innerText.includes("PICU") ||
c.innerText.includes("KORIDOR") ||
c.innerText.includes("ISOLASI")
);

if(!ruangCell) return "";

const nama=ruangCell.innerText.toUpperCase();

if(nama.includes("RPU-A")) return "RPU-A";
if(nama.includes("RPU-B")) return "RPU-B";
if(nama.includes("ICU")) return "ICU";
if(nama.includes("HCU")) return "HCU";
if(nama.includes("PICU")) return "PICU";
if(nama.includes("KORIDOR")) return "KORIDOR";
if(nama.includes("ISOLASI")) return "ISOLASI";

return "";
}

/* ================= DOKTER ================= */

function singkatDokter(nama){

nama=nama.replace(/\n/g," ").trim();

const map={
"Dedy Gunadi":"dr. Dedy, Sp.A",
"Fandy Erlangga":"dr. Fandy, Sp.PD",
"Widyastuti":"dr. Widyastuti, Sp.A",
"Kharisma Wibawa Nurdin Putra":"dr. Kharisma, Sp.PD",
"Rahardi Mokhtar":"dr. Rahardi, Sp.A",
"Ira Melintira Trinanty":"dr. Ira, Sp.P",
"Kiki Maharani":"dr. Kiki, Sp.PD",
"Khalid Mohammad Shidiq":"dr. Khalid, Sp.PD",
"Miky Akbar":"dr. Miky, Sp.A",
"Ercila Rizky Rolliana":"dr. Ercila, Sp.N",
"Ira Kusumastuti":"dr. Ika, Sp.P",
"Akhmad Isna Nurudinulloh":"dr. Isna, Sp.JP",
"Muhammad Hafiz Afif":"dr. Hafiz, Sp.B",
"Ahmad Mekkah":"dr. Mekkah, Sp.PD",
"Gogor Meisadona":"dr. Gogor, Sp.N",
"Cut Arsy Rahmi":"dr. Cut, Sp.JP",
"Adjie Pratignyo":"dr. Adjie, Sp.B",
"Widiawati Kurnia":"dr. WidKur, Sp.OG"
};

for(let key in map){
if(nama.includes(key)) return map[key];
}

return nama;
}

function formatDokter(data){

let arr=Object.entries(data)
.sort((a,b)=>b[1]-a[1])
.map(d=>`${d[0]} <span class="badge">${d[1]}</span>`);

return arr.join(" | ");
}

/* ================= PASIEN LOS TINGGI ================= */

function pasienLOSTinggi(){

const rows=document.querySelectorAll("#myTable tbody tr");

let list=[];

rows.forEach(row=>{

const cells=[...row.cells];

const namaCell=cells[5];
const diagnosaCell=cells[6];
const dokterCell=cells[7];
const losCell=cells.find(c=>c.innerText.match(/\d+\s*Hari/i));
const tarifCell=row.querySelector(".tarif-cell");

const ruang=getRuangan(cells);

if(!losCell||!namaCell)return;

const losNumeric=ambilLOS(losCell.innerText);
const hari=Math.floor(losNumeric);

const losText=losCell.innerText.trim();

let dokter="";

if(dokterCell){

dokter=singkatDokter(
dokterCell.innerText.split("\n")[0].trim()
);

}

if(hari>=5){

list.push({
nama:namaCell.innerText.split("\n")[0].trim(),
dokter,
losText,
hari,
ruang,
tarif:tarifCell?tarifCell.innerText.trim():"",
diagnosa:diagnosaCell?diagnosaCell.innerText.replace(/\n/g," ").trim():""
});

}

});

list.sort((a,b)=> b.hari - a.hari);

return list;

}

/* ================= BOR ================= */

function bedOccupancy(){

const rows=document.querySelectorAll("#myTable tbody tr");

let totalBed=101;
let terisi=rows.length;

let bor=((terisi/totalBed)*100).toFixed(1);

return {
text:`${terisi}/${totalBed}`,
percent:bor
};

}

/* ================= STATISTIK ================= */

function hitungStatistik(){

const rows=document.querySelectorAll("#myTable tbody tr");

let total = rows.length;
let sumLOS_RS=0;

let hijau=0;
let los4=0;
let los5=0;

let ruang4={};
let ruang5={};
let dokter={};

rows.forEach(row=>{

const cells=[...row.cells];

if(cells.length<5)return;

/* dokter */

const dokterCell=cells.find(c=>/dr\./i.test(c.innerText));

if(dokterCell){

let nama=dokterCell.innerText.split("\n")[0].trim();
nama=singkatDokter(nama);

dokter[nama]=(dokter[nama]||0)+1;

}

/* LOS */

const losCell=cells.find(c=>c.innerText.match(/\d+\s*Hari/i));

if(losCell){

let los=ambilLOS(losCell.innerText);
sumLOS_RS += los;

let hari=Math.floor(los);

if(hari<=3)hijau++;

else if(hari===4){

los4++;
const ruang=getRuangan(cells);
if(ruang)ruang4[ruang]=(ruang4[ruang]||0)+1;

}

else if(hari>=5){

los5++;
const ruang=getRuangan(cells);
if(ruang)ruang5[ruang]=(ruang5[ruang]||0)+1;

}

}

});

let alos=total>0?(sumLOS_RS/total).toFixed(2):"0.00";

return {total,alos,hijau,los4,los5,ruang4,ruang5,dokter};

}

/* ================= EXPORT CSV ================= */

function exportCSV(){

const rows=document.querySelectorAll("#myTable tr");

let csv=[];

rows.forEach(r=>{

let cols=r.querySelectorAll("td,th");

let row=[];

cols.forEach(c=>{
row.push('"'+c.innerText.replace(/\n/g," ").trim()+'"');
});

csv.push(row.join(";"));

});

let blob=new Blob([csv.join("\n")],{type:"text/csv"});

let a=document.createElement("a");

a.href=URL.createObjectURL(blob);
a.download="data_pasien_ranap.csv";

a.click();

}

/* ================= DASHBOARD ================= */

function buatDashboard(){

if(document.getElementById("dashboardPasien"))return;

const div=document.createElement("div");

div.id="dashboardPasien";

const d=hitungStatistik();
const losTinggi=pasienLOSTinggi();
const bor=bedOccupancy();

let textRuang4=d.los4>0?`(${Object.entries(d.ruang4).map(x=>x.join(":")).join(", ")})`:"";
let textRuang5=d.los5>0?`(${Object.entries(d.ruang5).map(x=>x.join(":")).join(", ")})`:"";

div.innerHTML=`

<div>

<b>Dashboard KMKB :</b>
Total Pasien : ${d.total} ||

<span class="dot hijau"></span> LOS ≤3 : ${d.hijau} |
<span class="dot orange"></span> LOS 4 : ${d.los4} ${textRuang4} |
<span class="dot merah"></span> LOS ≥5 : ${d.los5} ${textRuang5}

<button class="btn-export" id="exportCSV">Export CSV</button>

</div>

<div style="margin-top:6px">

<b>Dokter :</b> ${formatDokter(d.dokter)}

</div>

<div style="margin-top:6px">

<b>Bed Occupancy Ratio (BOR) :</b> ${bor.text}
<span class="bor-highlight">(${bor.percent}%)</span> ||
<b>ALOS :</b> ${d.alos}

</div>

<div class="los-box">

<div class="los-header" id="toggleLOS">
⚠ Pasien LOS Tinggi (${losTinggi.length})
</div>

<div id="losContent" class="hidden">

${losTinggi.map((p,i)=>`

<div class="los-item">

<b>${i+1}. ${p.nama} — ${p.dokter} — ${p.losText} — ${p.ruang} — ${p.tarif}</b>

<div class="los-diagnosa">${p.diagnosa}</div>

</div>

`).join("")}

</div>

</div>

`;

const table=document.querySelector("#myTable");

if(table){
table.parentElement.insertBefore(div,table);
}

setTimeout(()=>{

document.getElementById("toggleLOS").onclick=function(){

document.getElementById("losContent").classList.toggle("hidden");
this.classList.toggle("open");

};

document.getElementById("exportCSV").onclick=exportCSV;

},100);

}

setTimeout(buatDashboard,3000);

})();
