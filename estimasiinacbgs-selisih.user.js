// ==UserScript==
// @name         SmartPlus Estimasi INA-CBG + Selisih
// @namespace    http://tampermonkey.net/
// @version      1.2.6
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
    { keywords: ["stroke","cerebral infark","snh","Cerebral Infarction"], tarif: 4077800 },
    { keywords: ["stroke lama","stroke iskemik lama","sequele stroke"], tarif: 3242600 },
    { keywords: ["stroke lama level 2","stroke iskemik lama level 2","sequele stroke level 2"], tarif: 3772100 },
    { keywords: ["migrain vestibular","migrain"], tarif: 2155900 },
    { keywords: ["stemi"], tarif: 3509100 },
    { keywords: ["uap","unstable angina"], tarif: 3633300 },
    { keywords: ["chf","Adhf"], tarif: 2867100 },
    { keywords: ["chf level 2"], tarif: 3387500 },
    { keywords: ["af level 2"], tarif: 4971100 },
    { keywords: ["hhd"], tarif: 2119000 },
    { keywords: ["isk","infeksi saluran kemih"], tarif: 2479100 },
    { keywords: ["ispa", "Acute Lower Respiratory Infection"], tarif: 2000700 },
    { keywords: ["df","dhf","df dhf","dengue fever","Dengue Haemorrhagic Fever"], tarif: 1959100 },
    { keywords: ["dm","hiperglikemia"], tarif: 3648700 },
    { keywords: ["hypoglikemia"], tarif: 3648700 },
    { keywords: ["abses dm", "Ulkus Diabetik", "Nekrosis"], tarif: 3648700 },
    { keywords: ["abses + dm level 2"], tarif: 4797000 },
    { keywords: ["abses"], tarif: 1659600 },
    { keywords: ["abdominal pain","abd pain","vi","viral infection","viral infeksi","Typhoid Fever", "Viral Intestinal Infection"], tarif: 1652000 },
    { keywords: ["bii","bi","Cyclic Vomiting","Diarrhoea And Gastroenteritis","Bacterial Intestinal Infection","bacterial infection","Gastritis","Gea"], tarif: 1361300 },
    { keywords: ["Gastro-Oesophageal Reflux Disease With Oesophagitis","Dadrs","Dads","Dyspepsia", "Hematoschezia", "Vomitus"], tarif: 1361300 },
    { keywords: ["hematemesis"], tarif: 1361300 },
    { keywords: ["melena anemia"], tarif: 1934300 },
    { keywords: ["vertigo","bppv"], tarif: 1436900 },
    { keywords: ["convulsion","kds", "Kdk"], tarif: 2766600 },
    { keywords: ["ckd"], tarif: 3043000 },
    { keywords: ["hidronefrosis"], tarif: 3581900 },
    { keywords: ["lbp"], tarif: 3000100 },
    { keywords: ["morbili","Measles"], tarif: 1959100 },
    { keywords: ["appendicitis acute","App","App Akut","Appendicitis Akut","Acute Appendicitis"], tarif: 3668500 },
    { keywords: ["ht"], tarif: 2119000 },
    { keywords: ["dvt"], tarif: 4668700 },
    { keywords: ["Kejang Demam Simpleks","KDS"], tarif: 2766600 },
    { keywords: ["TTN"], tarif: 5466100 }
    
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
    if(!n && n !== 0) return "-";
    let sign = n < 0 ? "-" : "";
    return "Rp " + sign + Math.abs(n).toLocaleString("id-ID");
}

/* ================= CEK PASIEN ICU ================= */
function pasienICU(kelas){
    kelas = (kelas || "").toLowerCase();

    return (
        kelas.includes("icu") ||
        kelas.includes("picu") ||
        kelas.includes("nicu") ||
        kelas.includes("hcu")
    );
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
    let kelasIndex=4;

    headers.forEach((th,i)=>{
        if(th.innerText.includes("Tarif RS")) tarifIndex=i;
        if(th.innerText.includes("Action")) actionIndex=i;
    });

    if(tarifIndex===-1) return;

    let thINA=document.createElement("th");
    thINA.innerText="Estimasi INA-CBG";

    let thSel=document.createElement("th");
    thSel.innerText="Selisih";

    headers[actionIndex].before(thINA);
    headers[actionIndex].before(thSel);

    let rows=table.querySelectorAll("tbody tr");

    rows.forEach(row=>{

        let cells=row.querySelectorAll("td");
        if(cells.length <= actionIndex) return;

        let diagnosa=cells[6].innerText;
        let kelas=cells[kelasIndex] ? cells[kelasIndex].innerText : "";

        let tarifRS=parseInt(cells[tarifIndex].innerText.replace(/[^\d]/g,""))||0;

        let estimasi;

        if(pasienICU(kelas)){
            estimasi = 16165300;
        }else{
            estimasi = findTarifINA(diagnosa);
        }

        let tdINA=document.createElement("td");
        tdINA.innerText = estimasi > 0 ? rupiah(estimasi) : "-";

        let tdSel=document.createElement("td");

        if(estimasi > 0 && tarifRS > 0){

            let selisih = estimasi - tarifRS;

            tdSel.innerText = rupiah(selisih);

            if(selisih < 0){
                tdSel.style.background = "#d50000";
                tdSel.style.color = "white";
                tdSel.style.fontWeight = "bold";
            }else{
                tdSel.style.background = "#2e7d32";
                tdSel.style.color = "white";
                tdSel.style.fontWeight = "bold";
            }

        }else{
            tdSel.innerText="-";
        }

        cells[actionIndex].before(tdINA);
        cells[actionIndex].before(tdSel);

    });

}

setTimeout(init,1500);

})();
