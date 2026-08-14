/* ce-duration.js — shared experiment-length picker.  v2
 *
 * Shows a bilingual Short / Medium / Long screen before the experiment starts
 * and resolves with the chosen key ('short' | 'medium' | 'long').
 *
 * Usage in a runner (before jsPsych.run):
 *
 *   ceChooseDuration().then(function (choice) {
 *       const LENGTHS = { short: 6, medium: 10, long: 19 };
 *       ... build timeline ...
 *       jsPsych.run(timeline);
 *   });
 *
 * v2 change: the overlay no longer uses `background: inherit; color: inherit`.
 * Inheriting meant the picker was invisible whenever the page palette had not
 * resolved yet (jsPsych has not built its display element at this point, so
 * there is nothing reliable to inherit from). Colours are now explicit, with a
 * real dark-mode media query.
 */
function ceChooseDuration() {
    return new Promise(function (resolve) {
        const lang = (document.documentElement.lang === 'en') ? 'en' : 'hu';

        const txt = {
            hu: {
                title: 'Válassza ki a feladat hosszát',
                sub: 'Az időtartam hozzávetőleges.',
                short: 'Rövid', medium: 'Közepes', long: 'Hosszú',
                mins: 'kb. {n} perc'
            },
            en: {
                title: 'Choose the task length',
                sub: 'Durations are approximate.',
                short: 'Short', medium: 'Medium', long: 'Long',
                mins: '≈ {n} min'
            }
        }[lang];

        const opts = [
            { key: 'short',  label: txt.short,  mins: 3 },
            { key: 'medium', label: txt.medium, mins: 5 },
            { key: 'long',   label: txt.long,   mins: 10 }
        ];

        /* explicit palette, injected once as a real stylesheet */
        if (!document.getElementById('ce-duration-style')) {
            const st = document.createElement('style');
            st.id = 'ce-duration-style';
            st.textContent = `
                #ce-duration-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 1.2rem; padding: 1.5rem; text-align: center;
                    font-family: "Public Sans", system-ui, sans-serif;
                    background: #FBF7EE; color: #1F1B16;
                }
                #ce-duration-overlay h2 { font-weight: 500; margin: 0; font-size: 24px; }
                #ce-duration-overlay p  { margin: 0; opacity: 0.7; font-size: 15px; }
                #ce-duration-overlay .ce-row {
                    display: flex; gap: 1rem; flex-wrap: wrap;
                    justify-content: center; margin-top: 0.5rem;
                }
                #ce-duration-overlay button {
                    cursor: pointer; min-width: 140px; padding: 18px 22px;
                    border-radius: 12px; border: 2px solid #7A2B27;
                    background: transparent; color: inherit;
                    font-family: inherit; transition: background 0.15s;
                }
                #ce-duration-overlay button:hover,
                #ce-duration-overlay button:focus-visible {
                    background: rgba(122,43,39,0.12);
                    outline: 2px solid #7A2B27; outline-offset: 2px;
                }
                #ce-duration-overlay .ce-label { display: block; font-size: 19px; font-weight: 600; }
                #ce-duration-overlay .ce-mins  { display: block; font-size: 14px; opacity: 0.7; margin-top: 4px; }
                @media (prefers-color-scheme: dark) {
                    #ce-duration-overlay { background: #181612; color: #E8E3D6; }
                    #ce-duration-overlay button { border-color: #C26050; }
                    #ce-duration-overlay button:hover,
                    #ce-duration-overlay button:focus-visible {
                        background: rgba(194,96,80,0.18);
                        outline-color: #C26050;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    #ce-duration-overlay button { transition: none; }
                }
            `;
            document.head.appendChild(st);
        }

        const wrap = document.createElement('div');
        wrap.id = 'ce-duration-overlay';

        const h = document.createElement('h2');
        h.textContent = txt.title;
        wrap.appendChild(h);

        const sub = document.createElement('p');
        sub.textContent = txt.sub;
        wrap.appendChild(sub);

        const row = document.createElement('div');
        row.className = 'ce-row';
        wrap.appendChild(row);

        opts.forEach(function (o, i) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML =
                '<span class="ce-label">' + o.label + '</span>' +
                '<span class="ce-mins">' + txt.mins.replace('{n}', o.mins) + '</span>';
            btn.addEventListener('click', function () {
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
                resolve(o.key);
            });
            row.appendChild(btn);
            if (i === 0) setTimeout(function () { btn.focus(); }, 0);
        });

        document.body.appendChild(wrap);
    });
}
