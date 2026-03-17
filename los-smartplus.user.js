// ==UserScript==
// @name         SmartPlus LOS RS & BPJS
// @namespace    http://tampermonkey.net/
// @version      16
// @description  LOS RS + LOS BPJS dari E-PUDING + cache + fast + sort
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @match        http://192.168.3.16/smartplus/nurse_station/eranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/los-smartplus.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/los-smartplus.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CACHE_KEY = "smartplus_cache_all";

    /* ================= CACHE ================= */

    function getCache(){
        return JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");
    }

    function saveCache(cache){
        localStorage.setItem(CACHE_KEY,JSON.stringify(cache));
    }

    /* ================= HITUNG LOS RS ================= */

    function hitungLOS(tgl) {
        if (!tgl) return { text: "-", hari: 0 };
        
        let start = parseDate(tgl);
        if (isNaN(start.getTime())) return { text: "-", hari: 0 };

        let now = new Date();
        let diff = now - start;

        // Cegah nilai negatif yang aneh
        if (diff < 0) diff = 0;

        let hari = Math.floor(diff / (1000 * 60 * 60 * 24));
        let jam = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return { text: `${hari} Hari ${jam} Jam`, hari };
    }

    /* ================= HITUNG LOS BPJS ================= */

    function hitungLOSBPJS(tgl) {
        if (!tgl) return 0;
        
        let s = parseDate(tgl);
        if (isNaN(s.getTime())) return 0;

        let n = new Date();

        let sd = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        let nd = new Date(n.getFullYear(), n.getMonth(), n.getDate());

        let diff = Math.floor((nd - sd) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 1;
    }

    /* ================= DATE PARSER HELPER ================= */

    function parseDate(str) {
        if (!str) return new Date(NaN);
        
        // Bersihkan teks (hanya ambil angka, dash, titik dua, dan spasi)
        let clean = str.replace(/[^\d\-\s:]/g, "").trim();
        
        // Coba parsing langsung dulu
        let d = new Date(clean.replace(" ", "T"));
        if (!isNaN(d.getTime())) return d;
        
        // Coba tanpa T
        d = new Date(clean);
        if (!isNaN(d.getTime())) return d;
        
        // Coba manual split jika format YYYY-MM-DD HH:mm:ss
        let parts = clean.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
            return new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]);
        }
        
        return new Date(NaN);
    }

    /* ================= AMBIL WAKTU REGISTRASI ================= */

    function ambilWaktuRegistrasi(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");

        // Strategy 1: Search by combined text
        let combined = html.match(/(?:Waktu Registrasi|Regdate)\s*[:]\s*([\d\-\s:]{10,20})/i);
        if (combined) return combined[1].trim();

        // Strategy 2: Search specific labels
        let labels = ["Waktu Registrasi", "Regdate"];
        for (let label of labels) {
            let el = Array.from(doc.querySelectorAll("label, span, td, div")).find(e => 
                e.innerText.trim().replace(":","") === label
            );
            
            if (el) {
                // Check sibling
                let next = el.nextElementSibling;
                if (next && /[\d\-\s:]{10,}/.test(next.innerText)) return next.innerText.replace(":","").trim();
                
                // Check parent next sibling (for grid structures)
                let parent = el.parentElement;
                if (parent && parent.nextElementSibling) {
                    let v = parent.nextElementSibling.innerText.trim();
                    if (/[\d\-\s:]{10,}/.test(v)) return v.replace(":","").trim();
                }
                
                // Check inside parent (for .col-sm-9 structure)
                if (parent) {
                    let v = parent.querySelector(".col-sm-9, .col-md-9, .col-sm-8, .col-md-8");
                    if (v && /[\d\-\s:]{10,}/.test(v.innerText)) return v.innerText.replace(":","").trim();
                }
            }
        }
        
        // Log for debugging if enabled
        console.warn("SmartPlus: Gagal mengambil tanggal registrasi dari HTML");
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
        else if(hari===3){
            cell.style.background="#4caf50"; // hijau
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

    /* ================= PROSES SEMUA ROW ================= */

    async function prosesSatuBaris(row, rsIndex, cache) {
        let cells = row.querySelectorAll("td");
        if (!cells[rsIndex]) return;

        if (!row.querySelector(".losbpjs-cell")) {
            let td = document.createElement("td");
            td.className = "losbpjs-cell";
            cells[rsIndex].after(td);
        }

        let rsCell = row.querySelectorAll("td")[rsIndex];
        let bpjsCell = row.querySelector(".losbpjs-cell");

        let link = row.querySelector("td:last-child a");
        if (!link) {
            rsCell.innerText = "-";
            bpjsCell.innerText = "-";
            return;
        }

        let key = link.href;

        if (cache[key]) {
            tampilkan(cache[key], rsCell, bpjsCell);
            return;
        }

        rsCell.innerText = "Loading...";
        bpjsCell.innerText = "...";

        try {
            const html = await Promise.race([
                fetch(link.href).then(r => r.text()),
                new Promise((_, reject) => setTimeout(() => reject("timeout"), 8000))
            ]);

            let tgl = ambilWaktuRegistrasi(html);

            if (!tgl) {
                rsCell.innerText = "-";
                bpjsCell.innerText = "-";
                return;
            }

            cache[key] = { tgl };
            saveCache(cache);

            tampilkan(cache[key], rsCell, bpjsCell);
        } catch (e) {
            rsCell.innerText = "-";
            bpjsCell.innerText = "-";
        }
    }

    async function proses(rsIndex) {
        let cache = getCache();
        let rows = Array.from(document.querySelectorAll("#myTable tbody tr"));
        let index = 0;

        async function worker() {
            while (index < rows.length) {
                let currentRowIndex = index++; // Get current index and then increment
                if (currentRowIndex < rows.length) { // Ensure we don't go out of bounds if multiple workers increment simultaneously
                    let row = rows[currentRowIndex];
                    await prosesSatuBaris(row, rsIndex, cache);
                }
            }
        }

        let taskPool = [];
        for (let i = 0; i < MAX_PARALLEL; i++) {
            taskPool.push(worker());
        }

        await Promise.all(taskPool);
    }

    /* ================= INIT ================= */

    function init(){
        let rsIndex=setupColumns();
        if(rsIndex===null) return;

        proses(rsIndex);
    }

    setTimeout(init,2000);

})();
