// ==UserScript==
// @name         Dashboard Pasien Ranap
// @namespace    http://tampermonkey.net/
// @version      18.1
// @description  Dashboard statistik pasien Ranap berdasarkan LOS (Auto-update dari GitHub)
// @author       Gemini
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-losrsbpjs/main/los-smartplus.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-losrsbpjs/main/los-smartplus.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* ================= DASHBOARD DATA & STYLE ================= */
    const style = `
        #dashboardPasien {
            background: #ffffff;
            border: 1px solid #ccc;
            padding: 12px;
            margin-bottom: 10px;
            font-family: sans-serif;
            font-size: 14px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .dash-item { display: flex; align-items: center; gap: 5px; }
        .dot { height: 12px; width: 12px; border-radius: 50%; display: inline-block; }
        .dot-hijau { background-color: #4caf50; }
        .dot-orange { background-color: #ff9800; }
        .dot-merah { background-color: #d50000; }
        .dash-label { font-weight: bold; }
        .dash-value { font-weight: bold; font-size: 15px; }
    `;

    /* ================= FUNGSI HITUNG STATISTIK ================= */
    function hitungStatistik() {
        const rows = document.querySelectorAll("#myTable tbody tr");
        let stats = { total: 0, hijau: 0, orange: 0, merah: 0 };

        rows.forEach(row => {
            // Mencari cell yang berisi informasi hari dari script LOS
            const cells = Array.from(row.cells);
            const losCell = cells.find(c => c.innerText.includes("Hari"));
            
            if (losCell) {
                stats.total++;
                const hari = parseInt(losCell.innerText.split(" ")[0]);
                
                if (hari <= 3) stats.hijau++;
                else if (hari === 4) stats.orange++;
                else if (hari >= 5) stats.merah++;
            }
        });

        return stats;
    }

    /* ================= TAMPILKAN DASHBOARD ================= */
    function buatDashboard() {
        if (document.getElementById("dashboardPasien")) return;

        // Tambah Style ke Head
        const styleSheet = document.createElement("style");
        styleSheet.innerText = style;
        document.head.appendChild(styleSheet);

        const div = document.createElement("div");
        div.id = "dashboardPasien";
        
        const stats = hitungStatistik();

        div.innerHTML = `
            <div class="dash-item">
                <span class="dash-label">Dashboard Casemix | Total Pasien:</span>
                <span class="dash-value" id="v_total">${stats.total}</span>
            </div>
            <div class="dash-item">
                <span class="dot dot-hijau"></span>
                <span class="dash-label">LOS ≤3:</span>
                <span class="dash-value" id="v_hijau">${stats.hijau}</span>
            </div>
            <div class="dash-item">
                <span class="dot dot-orange"></span>
                <span class="dash-label">LOS 4:</span>
                <span class="dash-value" id="v_orange">${stats.orange}</span>
            </div>
            <div class="dash-item">
                <span class="dot dot-merah"></span>
                <span class="dash-label">LOS ≥5:</span>
                <span class="dash-value" id="v_merah">${stats.merah}</span>
            </div>
        `;

        const table = document.querySelector("#myTable");
        if (table) {
            table.parentElement.insertBefore(div, table);
        }
    }

    // Eksekusi setelah tabel selesai dimuat oleh script utama
    setTimeout(buatDashboard, 3000);

})();
