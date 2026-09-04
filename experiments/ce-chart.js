/* ce-chart.js — lightweight results charts for the experiment debrief.
 *
 * No dependencies. Draws onto a <canvas> using the site palette (reads CSS
 * variables, falls back to literals). Two chart types:
 *
 *   ceBarChart(canvas, { title, bars:[{label, value, unit}], ... })
 *   ceLineChart(canvas, { title, series:[{label, points:[{x,y}], color}], xLabel, yLabel })
 *
 * Used by every runner's final screen. Pair with ceResultsScreen() below to
 * build a full debrief panel (summary stats + chart) in one call.
 */

(function (global) {

    function cssVar(name, fallback) {
        try {
            const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            return v || fallback;
        } catch (e) { return fallback; }
    }

    function palette() {
        return {
            paper:  cssVar('--paper',  '#FBF7EE'),
            ink:    cssVar('--ink',    '#1F1B16'),
            inkSoft:cssVar('--ink-soft','#5A554C'),
            accent: cssVar('--accent', '#7A2B27'),
            accent2:'#C26050',
            grid:   'rgba(127,119,105,0.25)'
        };
    }

    /* high-DPI aware sizing */
    function setup(canvas, w, h) {
        const dpr = global.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return ctx;
    }

    function ceBarChart(canvas, opts) {
        const p = palette();
        const W = opts.width || 460, H = opts.height || 300;
        const ctx = setup(canvas, W, H);
        const bars = opts.bars || [];
        const padL = 56, padR = 20, padT = 36, padB = 52;
        const plotW = W - padL - padR, plotH = H - padT - padB;

        ctx.font = '600 16px "Public Sans", system-ui, sans-serif';
        ctx.fillStyle = p.ink;
        ctx.textAlign = 'left';
        if (opts.title) ctx.fillText(opts.title, padL - 8, 22);

        const maxV = Math.max.apply(null, bars.map(b => b.value)) || 1;
        const niceMax = niceCeil(maxV);

        // y axis gridlines + labels
        ctx.font = '12px "Public Sans", system-ui, sans-serif';
        ctx.fillStyle = p.inkSoft;
        ctx.strokeStyle = p.grid;
        ctx.lineWidth = 1;
        const ticks = 4;
        for (let i = 0; i <= ticks; i++) {
            const val = niceMax * i / ticks;
            const y = padT + plotH - (val / niceMax) * plotH;
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(val), padL - 8, y + 4);
        }

        // bars
        const n = bars.length;
        const gap = plotW / n * 0.30;
        const bw = (plotW - gap * (n + 1)) / n;
        bars.forEach((b, i) => {
            const x = padL + gap + i * (bw + gap);
            const bh = (b.value / niceMax) * plotH;
            const y = padT + plotH - bh;
            ctx.fillStyle = (i % 2 === 0) ? p.accent : p.accent2;
            roundRect(ctx, x, y, bw, bh, 4); ctx.fill();
            // value label
            ctx.fillStyle = p.ink;
            ctx.font = '600 13px "Public Sans", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.value + (b.unit ? ' ' + b.unit : ''), x + bw / 2, y - 6);
            // category label
            ctx.fillStyle = p.inkSoft;
            ctx.font = '12px "Public Sans", system-ui, sans-serif';
            wrapText(ctx, b.label, x + bw / 2, padT + plotH + 16, bw + gap, 13);
        });
    }

    function ceLineChart(canvas, opts) {
        const p = palette();
        const W = opts.width || 460, H = opts.height || 300;
        const ctx = setup(canvas, W, H);
        const series = opts.series || [];
        const padL = 56, padR = 20, padT = 36, padB = 56;
        const plotW = W - padL - padR, plotH = H - padT - padB;

        ctx.font = '600 16px "Public Sans", system-ui, sans-serif';
        ctx.fillStyle = p.ink; ctx.textAlign = 'left';
        if (opts.title) ctx.fillText(opts.title, padL - 8, 22);

        const allY = series.reduce((a, s) => a.concat(s.points.map(pt => pt.y)), []);
        const allX = series.reduce((a, s) => a.concat(s.points.map(pt => pt.x)), []);
        const maxY = niceCeil(Math.max.apply(null, allY) || 1);
        const minX = Math.min.apply(null, allX), maxX = Math.max.apply(null, allX);
        const spanX = (maxX - minX) || 1;

        // grid + y labels
        ctx.font = '12px "Public Sans", system-ui, sans-serif';
        ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
        const ticks = 4;
        for (let i = 0; i <= ticks; i++) {
            const val = maxY * i / ticks;
            const y = padT + plotH - (val / maxY) * plotH;
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
            ctx.fillStyle = p.inkSoft; ctx.textAlign = 'right';
            ctx.fillText(Math.round(val), padL - 8, y + 4);
        }
        // x labels (integers)
        ctx.textAlign = 'center';
        for (let xv = minX; xv <= maxX; xv++) {
            const x = padL + ((xv - minX) / spanX) * plotW;
            ctx.fillStyle = p.inkSoft;
            ctx.fillText(xv, x, padT + plotH + 18);
        }
        if (opts.xLabel) { ctx.fillText(opts.xLabel, padL + plotW / 2, H - 8); }

        // series lines + points
        series.forEach((s, si) => {
            const col = s.color || (si === 0 ? p.accent : p.accent2);
            ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
            ctx.beginPath();
            s.points.forEach((pt, i) => {
                const x = padL + ((pt.x - minX) / spanX) * plotW;
                const y = padT + plotH - (pt.y / maxY) * plotH;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            s.points.forEach(pt => {
                const x = padL + ((pt.x - minX) / spanX) * plotW;
                const y = padT + plotH - (pt.y / maxY) * plotH;
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
            });
        });

        // legend
        ctx.font = '12px "Public Sans", system-ui, sans-serif';
        ctx.textAlign = 'left';
        let lx = padL + 4;
        series.forEach((s, si) => {
            const col = s.color || (si === 0 ? p.accent : p.accent2);
            ctx.fillStyle = col; ctx.fillRect(lx, padT - 14, 12, 12);
            ctx.fillStyle = p.inkSoft;
            ctx.fillText(s.label, lx + 16, padT - 4);
            lx += 20 + ctx.measureText(s.label).width + 22;
        });
    }

    /* ---- helpers ---- */
    function niceCeil(v) {
        if (v <= 0) return 1;
        const mag = Math.pow(10, Math.floor(Math.log10(v)));
        const n = v / mag;
        const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
        return step * mag;
    }
    function roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2 < 0 ? 0 : h / 2);
        if (h < 0) h = 0;
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function wrapText(ctx, text, cx, y, maxW, lh) {
        const words = String(text).split(' ');
        let line = '', lines = [];
        words.forEach(w => {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
            else line = test;
        });
        if (line) lines.push(line);
        lines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * lh));
    }

    /* ----------------------------------------------------------------
       ceResultsScreen — builds a jsPsych html-keyboard-response trial that
       shows summary stat rows + a canvas chart, drawn after load.

       config = {
         compute: function(jsPsych) -> {
            rows:  [{label_hu, label_en, value}],      // summary table
            chart: { kind:'bar'|'line', ...chartOpts }, // passed to ceBarChart/ceLineChart
            note_hu, note_en                            // optional footnote (e.g. future work)
         }
       }
       ---------------------------------------------------------------- */
    function ceResultsScreen(jsPsych, config) {
        let chartSpec = null;
        const backHref  = config.backHref || '../index.html#experiments';
        const backHrefHome = config.homeHref || '../index.html';
        return {
            type: jsPsychHtmlKeyboardResponse,
            choices: "NO_KEYS",
            stimulus: function () {
                const r = config.compute(jsPsych);
                chartSpec = r.chart;
                let rows = '';
                (r.rows || []).forEach(function (row) {
                    rows += '<tr><td><span class="hu">' + row.label_hu + '</span>' +
                            '<span class="en">' + row.label_en + '</span></td>' +
                            '<td>' + row.value + '</td></tr>';
                });
                const note = (r.note_hu || r.note_en) ?
                    '<p style="font-size:13px;opacity:0.65;max-width:460px;margin:1rem auto 0;">' +
                    '<span class="hu">' + (r.note_hu || '') + '</span>' +
                    '<span class="en">' + (r.note_en || '') + '</span></p>' : '';
                const btnStyle =
                    'display:inline-block;cursor:pointer;margin:0.4rem;padding:12px 22px;border-radius:10px;' +
                    'font-family:inherit;font-size:15px;text-decoration:none;border:2px solid #7A2B27;';
                return '' +
                  '<div class="instructions-text">' +
                    '<p><span class="hu">Vége a feladatnak. Az eredményei:</span>' +
                       '<span class="en">The task is complete. Your results:</span></p>' +
                    '<table class="debrief-table">' + rows + '</table>' +
                    '<div style="margin:1.5rem auto 0;"><canvas id="ce-result-canvas"></canvas></div>' +
                    note +
                    '<div style="margin-top:1.8rem;">' +
                      '<a href="' + backHref + '" style="' + btnStyle + 'background:#7A2B27;color:#FBF7EE;">' +
                        '<span class="hu">Vissza a kísérletekhez</span>' +
                        '<span class="en">Back to experiments</span></a>' +
                      '<a href="' + backHrefHome + '" style="' + btnStyle + 'background:transparent;color:inherit;">' +
                        '<span class="hu">Főoldal</span>' +
                        '<span class="en">Home</span></a>' +
                    '</div>' +
                  '</div>';
            },
            on_load: function () {
                const canvas = document.getElementById('ce-result-canvas');
                if (!canvas || !chartSpec) return;
                if (chartSpec.kind === 'line') ceLineChart(canvas, chartSpec);
                else ceBarChart(canvas, chartSpec);
            }
        };
    }

    global.ceBarChart = ceBarChart;
    global.ceLineChart = ceLineChart;
    global.ceResultsScreen = ceResultsScreen;

})(window);
