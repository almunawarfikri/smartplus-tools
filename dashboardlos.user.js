// ==UserScript==
// @name         Dashboard TKMKB
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Dashboard LOS RS + ALOS RS + BOR + LOS Tinggi + Dokter + Export CSV
// @author       Fikri
// @match        http://192.168.3.16/smartplus/erm_ranap*
// @match        http://192.168.3.16/smartplus/nurse_station/eranap*
// @match        http://103.83.178.90:38/smartplus/erm_ranap
// @updateURL    https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/dashboardlos.user.js
// @downloadURL  https://raw.githubusercontent.com/almunawarfikri/smartplus-tools/main/dashboardlos.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* ================= AUTO HIDE SIDEBAR ================= */

    function hideSidebar() {

        const toggle = document.querySelector(".sidebartoggler");

        if (toggle) {
            toggle.click();
        }

    }

    setTimeout(hideSidebar, 1000);

    /* ================= STYLE ================= */

    const style = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

#dashboardPasien {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(226, 232, 240, 0.9);
    padding: 8px 12px;
    margin-bottom: 10px;
    font-family: 'Inter', -apple-system, blinkmacsystemfont, "Segoe UI", roboto, sans-serif;
    font-size: 14px;
    border-radius: 12px;
    line-height: 1.3;
    box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.05);
    color: #1e293b;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 8px;
    margin-bottom: 8px;
}

.stat-card {
    background: #f8fafc;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
}

.stat-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #64748b;
    margin-bottom: 2px;
    display: block;
}

.stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
}

.indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
}

.indicator.hijau { background: #dcfce7; color: #166534; }
.indicator.orange { background: #fef3c7; color: #92400e; }
.indicator.merah { background: #fee2e2; color: #991b1b; }

.dot {
    height: 6px;
    width: 6px;
    border-radius: 50%;
}

.hijau .dot { background: #22c55e; }
.orange .dot { background: #f59e0b; }
.merah .dot { background: #ef4444; }

.badge-dokter {
    display: inline-flex;
    align-items: center;
    background: #f8fafc;
    padding: 2px 8px;
    border-radius: 6px;
    margin: 1px;
    font-size: 12px;
    color: #475569;
    border: 1px solid #f1f5f9;
}

.badge-dokter .count {
    background: #6366f1;
    color: white;
    padding: 0px 5px;
    border-radius: 4px;
    margin-left: 6px;
    font-size: 10px;
    font-weight: 800;
}

.bor-pill {
    background: #6366f1;
    color: white;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 800;
    font-size: 12px;
}

.btn-export {
    background: #10b981;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    float: right;
    display: flex;
    align-items: center;
    gap: 4px;
}

.btn-export:hover {
    background: #059669;
}

.los-box {
    margin-top: 12px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    padding: 0;
    border-radius: 10px;
    overflow: hidden;
}

.los-header {
    font-weight: 700;
    cursor: pointer;
    padding: 8px 12px;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fef3c7;
    color: #92400e;
}

.los-header::after {
    content: "↓";
    font-size: 14px;
}

.los-content {
    max-height: 0;
    overflow: hidden;
}

.los-content.open {
    max-height: 1000px;
    padding: 4px 12px;
}

.los-item {
    padding: 6px 0;
    border-bottom: 1px solid rgba(0,0,0,0.03);
}

.los-info {
    font-weight: 600;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 13px;
}

.los-diagnosa {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
}

.section-title {
    font-size: 12px;
    font-weight: 800;
    color: #94a3b8;
    margin-bottom: 6px;
    text-transform: uppercase;
    display: block;
}

.hidden { display: none; }
`;

    document.head.appendChild(Object.assign(document.createElement("style"), { innerHTML: style }));

    /* ================= FORMAT ================= */

    function formatRupiah(n) {
        let sign = n < 0 ? "-" : "";
        let formatted = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return "Rp " + sign + formatted;
    }

    /* ================= HELPER KOLOM ================= */

    function getLOSColumnIndex() {
        const headers = document.querySelectorAll("#myTable thead th");
        for (let i = 0; i < headers.length; i++) {
            const txt = headers[i].innerText.trim();
            if (txt === "LOS RS" || txt === "Alamat") return i;
        }
        return -1;
    }

    /* ================= AMBIL LOS ================= */

    function ambilLOS(text) {

        const hari = text.match(/(\d+)\s*Hari/i);
        const jam = text.match(/(\d+)\s*Jam/i);

        let h = hari ? parseInt(hari[1]) : 0;
        let j = jam ? parseInt(jam[1]) : 0;

        return h + (j / 24);

    }

    /* ================= RUANGAN ================= */

    function getRuangan(cells) {
        let raw = "";
        if (cells[2]) {
            raw = cells[2].innerText.trim();
        } else {
            const ruangCell = cells.find(c =>
                c.innerText.includes("RPU") ||
                c.innerText.includes("ICU") ||
                c.innerText.includes("HCU") ||
                c.innerText.includes("PICU") ||
                c.innerText.includes("KORIDOR") ||
                c.innerText.includes("ISOLASI")
            );
            if (!ruangCell) return "";
            raw = ruangCell.innerText.trim();
        }

        // OVOID ROOM NUMBERS: Strip digits and anything after a space or colon if it looks like a room
        // example: "RPU-A 207" -> "RPU-A"
        return raw.split(/\s+/)[0].toUpperCase().trim();
    }

    /* ================= DOKTER ================= */

    function singkatDokter(nama) {

        nama = nama.replace(/\n/g, " ").trim();

        const map = {
            "Dedy Gunadi": "dr. Dedy, Sp.A",
            "Fandy Erlangga": "dr. Fandy, Sp.PD",
            "Widyastuti": "dr. Widyastuti, Sp.A",
            "Kharisma Wibawa Nurdin Putra": "dr. Kharisma, Sp.PD",
            "Rahardi Mokhtar": "dr. Rahardi, Sp.A",
            "Ira Melintira Trinanty": "dr. Ira, Sp.P",
            "Kiki Maharani": "dr. Kiki, Sp.PD",
            "Khalid Mohammad Shidiq": "dr. Khalid, Sp.PD",
            "Miky Akbar": "dr. Miky, Sp.A",
            "Ercila Rizky Rolliana": "dr. Ercila, Sp.N",
            "Ira Kusumastuti": "dr. Ika, Sp.P",
            "Akhmad Isna Nurudinulloh": "dr. Isna, Sp.JP",
            "Muhammad Hafiz Afif": "dr. Hafiz, Sp.B",
            "Ahmad Mekkah": "dr. Mekkah, Sp.PD",
            "Gogor Meisadona": "dr. Gogor, Sp.N",
            "Cut Arsy Rahmi": "dr. Cut, Sp.JP",
            "Adjie Pratignyo": "dr. Adjie, Sp.B",
            "Widiawati Kurnia": "dr. WidKur, Sp.OG"
        };

        for (let key in map) {
            if (nama.includes(key)) return map[key];
        }

        return nama;
    }

    function formatDokter(data) {

        let arr = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map(d => `<div class="badge-dokter"><span>${d[0]}</span><span class="count">${d[1]}</span></div>`);

        return arr.join("");
    }

    /* ================= PASIEN LOS TINGGI ================= */

    function pasienLOSTinggi() {

        const rows = document.querySelectorAll("#myTable tbody tr");
        const losIdx = getLOSColumnIndex();
        let list = [];

        rows.forEach(row => {
            const cells = [...row.cells];
            const namaCell = cells[5];
            const diagnosaCell = cells[6];
            const dokterCell = cells[7];

            // Prefer the specific LOS column if found, otherwise fallback to finding pattern (but restricted)
            let losCell = null;
            if (losIdx !== -1 && cells[losIdx]) {
                losCell = cells[losIdx];
            } else {
                // Fallback: search cells, but prioritize those likely to be LOS
                losCell = cells.find(c => /^\s*\d+\s*Hari/i.test(c.innerText));
            }

            const tarifCell = row.querySelector(".tarif-cell");

            const ruang = getRuangan(cells);

            if (!losCell || !namaCell) return;

            const losNumeric = ambilLOS(losCell.innerText);
            const hari = Math.floor(losNumeric);

            const losText = losCell.innerText.trim();

            let dokter = "";

            if (dokterCell) {

                dokter = singkatDokter(
                    dokterCell.innerText.split("\n")[0].trim()
                );

            }

            if (hari >= 5) {

                list.push({
                    rm: namaCell ? namaCell.innerText.split("\n").pop().trim() : "",
                    nama: namaCell.innerText.split("\n")[0].trim(),
                    dokter,
                    losText,
                    hari,
                    ruang,
                    diagnosa: diagnosaCell ? diagnosaCell.innerText.replace(/\n/g, " ").trim() : ""
                });

            }

        });

        list.sort((a, b) => b.hari - a.hari);

        return list;

    }

    /* ================= BOR ================= */

    function bedOccupancy() {

        const rows = document.querySelectorAll("#myTable tbody tr");

        let totalBed = 101;
        let terisi = rows.length;

        let bor = ((terisi / totalBed) * 100).toFixed(1);

        return {
            text: `${terisi}/${totalBed}`,
            percent: bor
        };

    }

    /* ================= STATISTIK ================= */

    function hitungStatistik() {

        const rows = document.querySelectorAll("#myTable tbody tr");
        const losIdx = getLOSColumnIndex();

        let total = rows.length;
        let sumLOS_RS = 0;

        let hijau = 0;
        let los4 = 0;
        let los5 = 0;

        let ruang4 = {};
        let ruang5 = {};
        let dokter = {};

        rows.forEach(row => {

            const cells = [...row.cells];

            if (cells.length < 5) return;

            /* dokter */

            const dokterCell = cells.find(c => /dr\./i.test(c.innerText));

            if (dokterCell) {

                let nama = dokterCell.innerText.split("\n")[0].trim();
                nama = singkatDokter(nama);

                dokter[nama] = (dokter[nama] || 0) + 1;

            }

            /* LOS */

            let losCell = null;
            if (losIdx !== -1 && cells[losIdx]) {
                losCell = cells[losIdx];
            } else {
                losCell = cells.find(c => /^\s*\d+\s*Hari/i.test(c.innerText));
            }

            if (losCell) {

                let los = ambilLOS(losCell.innerText);
                sumLOS_RS += los;

                let hari = Math.floor(los);

                if (hari <= 3) hijau++;

                else if (hari === 4) {

                    los4++;
                    const ruang = getRuangan(cells);
                    if (ruang) ruang4[ruang] = (ruang4[ruang] || 0) + 1;

                }

                else if (hari >= 5) {

                    los5++;
                    const ruang = getRuangan(cells);
                    if (ruang) ruang5[ruang] = (ruang5[ruang] || 0) + 1;

                }

            }

        });

        let alos = total > 0 ? (sumLOS_RS / total).toFixed(2) : "0.00";

        return { total, alos, hijau, los4, los5, ruang4, ruang5, dokter };

    }

    /* ================= EXPORT CSV ================= */

    function exportCSV() {

        const rows = document.querySelectorAll("#myTable tr");

        let csv = [];

        rows.forEach(r => {

            let cols = r.querySelectorAll("td,th");

            let row = [];

            cols.forEach(c => {
                row.push('"' + c.innerText.replace(/\n/g, " ").trim() + '"');
            });

            csv.push(row.join(";"));

        });

        let blob = new Blob([csv.join("\n")], { type: "text/csv" });

        let a = document.createElement("a");

        a.href = URL.createObjectURL(blob);
        a.download = "data_pasien_ranap.csv";

        a.click();

    }

    /* ================= DASHBOARD ================= */

    function buatDashboard() {

        if (document.getElementById("dashboardPasien")) return;

        const d = hitungStatistik();
        const losTinggi = pasienLOSTinggi();
        const bor = bedOccupancy();

        const div = document.createElement("div");
        div.id = "dashboardPasien";

        let textRuang4 = d.los4 > 0 ? `<small>${Object.entries(d.ruang4).map(x => x.join(" : ")).join(", ")}</small>` : "";
        let textRuang5 = d.los5 > 0 ? `<small>${Object.entries(d.ruang5).map(x => x.join(" : ")).join(", ")}</small>` : "";

        div.innerHTML = `
    <div style="margin-bottom: 12px; display: flow-root; line-height: 1;">
        <span style="font-size: 16px; font-weight: 800; color: #0f172a;">DASHBOARD TKMKB</span>
        <button class="btn-export" id="exportCSV">
            <span>⬇</span> Export
        </button>
    </div>

    <div class="dashboard-grid">
        <div class="stat-card">
            <span class="stat-label">Ringkasan</span>
            <div class="stat-value">${d.total} <small style="font-weight: 500; font-size: 12px; color: #64748b;">Pasien</small></div>
            <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
                <div class="indicator hijau">≤3: ${d.hijau}</div>
                <div class="indicator orange">4: ${d.los4}</div>
                <div class="indicator merah">≥5: ${d.los5}</div>
            </div>
        </div>

        <div class="stat-card">
            <span class="stat-label">BOR & ALOS</span>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="font-size: 11px; font-weight: 700;">BOR</span>
                        <span class="bor-pill">${bor.percent}%</span>
                    </div>
                    <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${bor.percent}%; height: 100%; background: #6366f1; border-radius: 2px;"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b;">Running ALOS (Harian)</span>
                    <span class="stat-value" style="font-size: 16px;">${d.alos}</span>
                </div>
            </div>
        </div>

        <div class="stat-card">
            <span class="stat-label">Distribusi LOS > 3</span>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
                <div style="display: flex; gap: 4px; align-items: center;">
                    <span class="indicator orange" style="padding: 1px 4px; font-size: 10px;">LOS 4</span>
                    <span style="color: #64748b; font-size: 11px;">${textRuang4 || '-'}</span>
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                    <span class="indicator merah" style="padding: 1px 4px; font-size: 10px;">LOS ≥5</span>
                    <span style="color: #64748b; font-size: 11px;">${textRuang5 || '-'}</span>
                </div>
            </div>
        </div>
    </div>

    <div>
        <span class="section-title">Dokter</span>
        <div style="display: flex; flex-wrap: wrap;">
            ${formatDokter(d.dokter)}
        </div>
    </div>

    <div class="los-box">
        <div class="los-header" id="toggleLOS" style="padding: 8px 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>⚠ Pasien LOS Tinggi</span>
                <span class="indicator merah" style="background: #ef4444; color: white; padding: 1px 6px;">${losTinggi.length}</span>
            </div>
        </div>
        <div id="losContent" class="los-content">
            ${losTinggi.map((p, i) => `
                <div class="los-item">
                    <div class="los-info" style="font-size: 12px;">
                        <span style="color: #1e293b; font-weight: 700;">${i + 1}. ${p.nama} (${p.rm})</span>
                        <span class="badge-dokter" style="margin: 0; padding: 1px 6px; font-size: 11px;">${p.dokter}</span>
                        <span class="indicator orange" style="font-size: 11px; padding: 1px 5px;">⏱ ${p.losText}</span>
                        <span class="indicator" style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 1px 5px;">📍 ${p.ruang}</span>
                        <span style="color: #4f46e5; font-weight: 500; font-size: 12px; margin-left: auto; text-align: right; flex-grow: 1;">${p.diagnosa}</span>
                    </div>
                </div>
            `).join("")}
        </div>
    </div>
`;

        const table = document.querySelector("#myTable");
        if (table) {
            table.parentElement.insertBefore(div, table);
        }

        setTimeout(() => {
            const toggle = document.getElementById("toggleLOS");
            const content = document.getElementById("losContent");

            toggle.onclick = function () {
                this.classList.toggle("open");
                content.classList.toggle("open");
            };

            document.getElementById("exportCSV").onclick = exportCSV;
        }, 100);

    }

    setTimeout(buatDashboard, 3000);

})();
