// ==UserScript==
// @name         Dashboard TKMKB
// @namespace    http://tampermonkey.net/
// @version      1.6.2
// @description  Dashboard LOS + Ruangan + Dokter
// @author       Fikri
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/dashboardlos.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/dashboardlos.user.js
// @grant        none
// ==/UserScript==

(function() {
'use strict';

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
}

.dot{
    height:12px;
    width:12px;
    border-radius:50%;
    display:inline-block;
    margin-right:5px;
}

.hijau{background:#4caf50;}
.orange{background:#ff9800;}
.merah{background:#d50000;}

.ruang-detail{
    background:#f5f5f5;
    padding:3px 8px;
    border-radius:4px;
    margin-left:5px;
}

.dokter-list{
    margin-top:8px;
}

.badge{
    background:#1976d2;
    color:white;
    padding:2px 7px;
    border-radius:4px;
    margin-left:4px;
    font-size:12px;
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = style;
document.head.appendChild(styleSheet);


/* ================= SINGKAT NAMA DOKTER ================= */

function singkatDokter(nama){

    nama = nama.replace(/\n/g," ").trim();

    const map = {

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

        if(nama.includes(key)){

            return map[key];

        }

    }

    return nama;

}


/* ================= HITUNG DATA ================= */

function hitungStatistik(){

    const rows=document.querySelectorAll("#myTable tbody tr");

    let total=0;
    let hijau=0;
    let los4=0;
    let los5=0;

    let ruang4={};
    let ruang5={};
    let dokter={};

    rows.forEach(row=>{

        const cells=[...row.cells];

        /* ===== DOKTER ===== */

        const dokterCell = cells.find(c => /dr\./i.test(c.innerText));

        if(dokterCell){

    let nama = dokterCell.innerText.split("\n")[0].trim();

    if(!nama.toLowerCase().includes("dr.")) return;

    nama = singkatDokter(nama);

    dokter[nama] = (dokter[nama] || 0) + 1;

}

        /* ===== LOS ===== */

        const losCell=cells.find(c=>c.innerText.includes("Hari"));

        if(!losCell) return;

        const hari=parseInt(losCell.innerText);

        total++;

        if(hari<=3) hijau++;

        if(hari===4){

            los4++;

            const ruang=getRuangan(cells);

            if(ruang) ruang4[ruang]=(ruang4[ruang]||0)+1;

        }

        if(hari>=5){

            los5++;

            const ruang=getRuangan(cells);

            if(ruang) ruang5[ruang]=(ruang5[ruang]||0)+1;

        }

    });

    return {total,hijau,los4,los5,ruang4,ruang5,dokter};

}


/* ================= RUANGAN ================= */

function getRuangan(cells){

    const ruangCell=cells.find(c=>
        c.innerText.includes("RPU") ||
        c.innerText.includes("ICU") ||
        c.innerText.includes("HCU") ||
        c.innerText.includes("PICU") ||
        c.innerText.includes("KEBIDANAN") ||
        c.innerText.includes("KORIDOR") ||
        c.innerText.includes("ISOLASI")
    );

    if(!ruangCell) return null;

    const nama=ruangCell.innerText.toUpperCase();

    if(nama.includes("RPU-A")) return "RPU-A";
    if(nama.includes("RPU-B")) return "RPU-B";
    if(nama.includes("RPU-C")) return "RPU-C";
    if(nama.includes("ICU")) return "ICU";
    if(nama.includes("HCU")) return "HCU";
    if(nama.includes("HCU")) return "PICU";
    if(nama.includes("KEBIDANAN")) return "Kebidanan";
    if(nama.includes("KORIDOR")) return "Koridor";
    if(nama.includes("ISOLASI")) return "ISOLASI";

    return null;

}


/* ================= FORMAT RUANG ================= */

function formatRuang(data){

    let arr=[];

    Object.keys(data).forEach(r=>{

        arr.push(`${r}:${data[r]}`);

    });

    return arr.join(", ");

}


/* ================= FORMAT DOKTER ================= */

function formatDokter(data){

    let arr = Object.entries(data)
        .sort((a,b)=>b[1]-a[1])
        .map(d=>`${d[0]} <span class="badge">${d[1]}</span>`);

    return arr.join(" | ");

}


/* ================= DASHBOARD ================= */

function buatDashboard(){

    if(document.getElementById("dashboardPasien")) return;

    const div=document.createElement("div");
    div.id="dashboardPasien";

    const d=hitungStatistik();

    div.innerHTML=`

    <b>Dashboard KMKB</b> |
    Total Pasien: ${d.total}

    &nbsp;&nbsp;
    <span class="dot hijau"></span>
    LOS ≤3: ${d.hijau}

    &nbsp;&nbsp;
    <span class="dot orange"></span>
    LOS 4: ${d.los4} (${formatRuang(d.ruang4)})

    &nbsp;&nbsp;
    <span class="dot merah"></span>
    LOS ≥5: ${d.los5} (${formatRuang(d.ruang5)})

    <div class="dokter-list">
    <b>Dokter :</b> ${formatDokter(d.dokter)}
    </div>

    `;

    const table=document.querySelector("#myTable");

    if(table){

        table.parentElement.insertBefore(div,table);

    }

}


/* ================= RUN ================= */

setTimeout(buatDashboard,3000);

})();
