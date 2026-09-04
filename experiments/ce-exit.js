/* ce-exit.js — press ESC to leave an experiment at any point
 *     ceEnableExit();
 *     ceEnableExit({ href: '../index.html#experiments' });   // fallback target
 *     ceEnableExit({ confirm: false });                      // leave on first ESC
 */
(function (root) {
    'use strict';

    var TEXT = {
        hu: {
            title:  'Kilép a feladatból?',
            body:   'A megkezdett feladat elveszik, és nem folytatható. Eddig semmi nem került mentésre.',
            again:  'Nyomja meg még egyszer az ESC gombot a kilépéshez, vagy bármely más gombot a folytatáshoz.',
            leave:  'Kilépés',
            stay:   'Folytatás'
        },
        en: {
            title:  'Leave the task?',
            body:   'The run in progress will be lost and cannot be resumed. Nothing has been saved so far.',
            again:  'Press ESC again to leave, or any other key to carry on.',
            leave:  'Leave',
            stay:   'Carry on'
        }
    };

    var CSS = [
        '.ce-exit-scrim{',
        '  position:fixed; inset:0; z-index:10000;',
        '  display:flex; align-items:center; justify-content:center; padding:24px;',
        '  background:rgba(31,27,22,.55);',
        '  font-family:"Public Sans",system-ui,sans-serif;',
        '}',
        '.ce-exit-panel{',
        '  width:100%; max-width:420px; box-sizing:border-box;',
        '  padding:24px 26px; border-radius:10px; text-align:left;',
        '  background:#FBF7EE; color:#1F1B16;',
        '  box-shadow:0 12px 40px rgba(0,0,0,.28);',
        '}',
        '.ce-exit-title{ font-family:"Cormorant Garamond",Georgia,serif;',
        '  font-size:24px; font-weight:600; margin:0 0 .6rem; }',
        '.ce-exit-body{ font-size:15px; line-height:1.6; margin:0 0 1rem; opacity:.8; }',
        '.ce-exit-again{ font-size:13px; line-height:1.5; margin:0 0 1.2rem; opacity:.6; }',
        '.ce-exit-row{ display:flex; gap:10px; }',
        '.ce-exit-btn{ flex:1; padding:10px 14px; font:inherit; font-size:15px;',
        '  cursor:pointer; border-radius:7px; border:1px solid rgba(31,27,22,.28);',
        '  background:transparent; color:inherit; }',
        '.ce-exit-btn.primary{ background:#7A2B27; border-color:#7A2B27; color:#FBF7EE; }',
        '.ce-exit-btn:focus-visible{ outline:2px solid #7A2B27; outline-offset:2px; }',
        '@media (prefers-color-scheme:dark){',
        '  .ce-exit-panel{ background:#221F1A; color:#E8E3D6; }',
        '  .ce-exit-btn{ border-color:rgba(232,227,214,.26); }',
        '  .ce-exit-btn.primary{ background:#E0A24A; border-color:#E0A24A; color:#181612; }',
        '  .ce-exit-btn:focus-visible{ outline-color:#E0A24A; }',
        '}'
    ].join('\n');

    function injectStyles() {
        if (document.getElementById('ce-exit-styles')) return;
        var s = document.createElement('style');
        s.id = 'ce-exit-styles';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    function lang() {
        return document.documentElement.lang === 'en' ? 'en' : 'hu';
    }

    // Only trust the referrer when it points at this same site. A cross-origin
    // referrer would send the participant somewhere unrelated. */
    function sameOriginReferrer() {
        try {
            if (!document.referrer) return null;
            var u = new URL(document.referrer, location.href);
            if (u.origin !== location.origin) return null;
            if (u.href === location.href) return null;   // reloaded, not arrived
            return u.href;
        } catch (e) {
            return null;
        }
    }

    function ceEnableExit(options) {
        options = options || {};
        var fallback    = options.href || '../index.html#experiments';
        var needConfirm = options.confirm !== false;

        if (root.__ceExitEnabled) return;   //
        root.__ceExitEnabled = true;

        injectStyles();

        var scrim = null;

        function destination() {
            return sameOriginReferrer() || fallback;
        }

        function leave() {
            close();
            root.location.href = destination();
        }

        function close() {
            if (scrim && scrim.parentNode) scrim.parentNode.removeChild(scrim);
            scrim = null;
        }

        function open() {
            var t = TEXT[lang()];
            scrim = document.createElement('div');
            scrim.className = 'ce-exit-scrim';
            scrim.setAttribute('role', 'dialog');
            scrim.setAttribute('aria-modal', 'true');

            var panel = document.createElement('div');
            panel.className = 'ce-exit-panel';

            var h = document.createElement('p');
            h.className = 'ce-exit-title';
            h.textContent = t.title;

            var b = document.createElement('p');
            b.className = 'ce-exit-body';
            b.textContent = t.body;

            var a = document.createElement('p');
            a.className = 'ce-exit-again';
            a.textContent = t.again;

            var row = document.createElement('div');
            row.className = 'ce-exit-row';

            var stay = document.createElement('button');
            stay.type = 'button';
            stay.className = 'ce-exit-btn';
            stay.textContent = t.stay;
            stay.addEventListener('click', close);

            var go = document.createElement('button');
            go.type = 'button';
            go.className = 'ce-exit-btn primary';
            go.textContent = t.leave;
            go.addEventListener('click', leave);

            row.appendChild(stay);
            row.appendChild(go);
            panel.appendChild(h);
            panel.appendChild(b);
            panel.appendChild(a);
            panel.appendChild(row);
            scrim.appendChild(panel);
            document.body.appendChild(scrim);
        }

        document.addEventListener('keydown', function (e) {
            if (scrim) {
                // Panel is open: swallow everything so jsPsych cannot log these
                // keys as a response to whatever trial is on screen.
                e.preventDefault();
                e.stopImmediatePropagation();
                if (e.key === 'Escape') leave();
                else close();
                return;
            }

            if (e.key !== 'Escape' && e.key !== 'Esc') return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (needConfirm) open();
            else leave();
        }, true);
    }

    root.ceEnableExit = ceEnableExit;
})(window);
