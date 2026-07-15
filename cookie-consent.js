(function() {
    const consentCookie = 'dev_days_analytics_consent';
    const consentDuration = 60 * 60 * 24 * 180;

    function readConsent() {
        const prefix = consentCookie + '=';
        const cookie = document.cookie.split('; ').find(item => item.startsWith(prefix));
        return cookie ? cookie.slice(prefix.length) : null;
    }

    document.addEventListener('DOMContentLoaded', function() {
        const manageButton = document.getElementById('manageCookies');
        const dialog = document.getElementById('cookiePreferences');
        const form = document.getElementById('cookiePreferencesForm');
        if (!manageButton || !dialog || !form) return;

        const closeButton = dialog.querySelector('.cookie-dialog-close');

        manageButton.addEventListener('click', function() {
            const selected = readConsent() === 'accepted' ? 'accepted' : 'rejected';
            form.elements.analytics.value = selected;
            dialog.showModal();
        });

        closeButton.addEventListener('click', function() {
            dialog.close();
        });

        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const value = form.elements.analytics.value;
            document.cookie = consentCookie + '=' + value + '; Max-Age=' + consentDuration + '; Path=/; SameSite=Lax; Secure';
            dialog.close();
        });
    });
})();
