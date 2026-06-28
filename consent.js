/* =========================================================================
   Jam Room — Cookie consent + Google Analytics loader
   -------------------------------------------------------------------------
   GDPR/ePrivacy compliant:
   - No cookies and no Google Analytics load until the user clicks "Accept".
   - "Accept" and "Reject" are equally prominent (same size/weight).
   - The choice is remembered and can be changed any time via the
     "Cookie settings" footer link (or calling JamRoomConsent.reopen()).

   SETUP: replace G-XXXXXXXXXX below with your real GA4 Measurement ID.
   ========================================================================= */
(function () {
    "use strict";

    var GA_MEASUREMENT_ID = "G-6PDWMCRRK5"; // GA4 Measurement ID
    var STORAGE_KEY = "jamroom-cookie-consent"; // "granted" | "denied"

    function getConsent() {
        try { return localStorage.getItem(STORAGE_KEY); }
        catch (e) { return null; }
    }

    function setConsent(value) {
        try { localStorage.setItem(STORAGE_KEY, value); }
        catch (e) { /* storage blocked — banner will just show again next visit */ }
    }

    /* ---- Load Google Analytics (only ever called after consent granted) ---- */
    var gaLoaded = false;
    function loadGoogleAnalytics() {
        if (gaLoaded || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") {
            return;
        }
        gaLoaded = true;

        var s = document.createElement("script");
        s.async = true;
        s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
        document.head.appendChild(s);

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
    }

    /* ---- Banner UI ---- */
    function buildBanner() {
        if (document.getElementById("cookie-banner")) return;

        var banner = document.createElement("div");
        banner.id = "cookie-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-live", "polite");
        banner.setAttribute("aria-label", "Cookie consent");
        banner.innerHTML =
            '<div class="cookie-banner-inner">' +
                '<p class="cookie-banner-text">' +
                    'We use Google Analytics cookies to understand how visitors use our site. ' +
                    'These are only set if you accept. See our ' +
                    '<a href="privacy.html#cookies">Cookie &amp; Privacy Policy</a>.' +
                '</p>' +
                '<div class="cookie-banner-actions">' +
                    '<button type="button" id="cookie-reject" class="cookie-btn cookie-btn-secondary">Reject</button>' +
                    '<button type="button" id="cookie-accept" class="cookie-btn cookie-btn-primary">Accept</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(banner);

        document.getElementById("cookie-accept").addEventListener("click", function () {
            setConsent("granted");
            hideBanner();
            loadGoogleAnalytics();
        });
        document.getElementById("cookie-reject").addEventListener("click", function () {
            setConsent("denied");
            hideBanner();
        });

        requestAnimationFrame(function () { banner.classList.add("cookie-banner-visible"); });
    }

    function hideBanner() {
        var banner = document.getElementById("cookie-banner");
        if (banner) banner.classList.remove("cookie-banner-visible");
    }

    function showBanner() { buildBanner(); }

    /* ---- Public API: let users change their choice later ---- */
    window.JamRoomConsent = {
        reopen: function () {
            buildBanner();
            var banner = document.getElementById("cookie-banner");
            if (banner) requestAnimationFrame(function () { banner.classList.add("cookie-banner-visible"); });
        }
    };

    /* ---- Boot ---- */
    function init() {
        var choice = getConsent();
        if (choice === "granted") {
            loadGoogleAnalytics();
        } else if (choice === "denied") {
            /* respect refusal — do nothing */
        } else {
            showBanner();
        }

        /* Wire up any "Cookie settings" links */
        var links = document.querySelectorAll('[data-cookie-settings]');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener("click", function (e) {
                e.preventDefault();
                window.JamRoomConsent.reopen();
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
