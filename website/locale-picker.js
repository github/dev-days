(function () {
    var match = location.pathname.match(/\/(pt_BR|es|ko)(?:\/|$)/);
    var locale = match ? match[1] : 'en';
    var picker = document.getElementById('localePicker');
    if (!picker) return;

    var toggleBtn = picker.querySelector('.locale-toggle');
    var list = picker.querySelector('[role="listbox"]');
    var currentLabel = picker.querySelector('.locale-current');
    if (!toggleBtn || !list || !currentLabel) {
        console.error('Unable to initialize the language picker: required markup is missing.');
        return;
    }

    var options = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));
    if (options.length === 0) {
        console.error('Unable to initialize the language picker: no language options were found.');
        return;
    }

    var labels = {
        en: 'English',
        es: 'Español',
        pt_BR: 'Português (Brasil)',
        ko: '한국어'
    };
    currentLabel.textContent = labels[locale] || labels.en;

    function normalizeLocale(value) {
        return value === 'pt-BR' ? 'pt_BR' : value;
    }

    options.forEach(function (option) {
        var optionLocale = normalizeLocale(option.dataset.locale);
        var selected = optionLocale === locale;
        option.tabIndex = -1;
        option.classList.toggle('active', selected);
        option.setAttribute('aria-selected', String(selected));
        option.addEventListener('click', function (event) {
            event.stopPropagation();
            selectOption(option);
        });
    });

    function focusOption(option) {
        options.forEach(function (candidate) {
            candidate.tabIndex = candidate === option ? 0 : -1;
        });
        option.focus();
    }

    function close(restoreFocus) {
        list.style.display = 'none';
        toggleBtn.setAttribute('aria-expanded', 'false');
        options.forEach(function (option) {
            option.tabIndex = -1;
        });
        if (restoreFocus) toggleBtn.focus();
    }

    function open() {
        list.style.display = 'block';
        toggleBtn.setAttribute('aria-expanded', 'true');
        var selected = options.find(function (option) {
            return option.getAttribute('aria-selected') === 'true';
        }) || options[0];
        focusOption(selected);
    }

    function selectOption(option) {
        var target = normalizeLocale(option.dataset.locale);
        if (target === locale) {
            close(true);
            return;
        }

        var base = locale === 'en' ? new URL('./', location.href) : new URL('../', location.href);
        var path = target === 'en' ? './' : target + '/';
        localStorage.setItem('preferred-locale', target);
        window.location.href = new URL(path, base).href;
    }

    toggleBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        if (list.style.display === 'block') close(true);
        else open();
    });

    list.addEventListener('keydown', function (event) {
        var activeIndex = options.indexOf(document.activeElement);
        if (activeIndex === -1) {
            activeIndex = options.findIndex(function (option) {
                return option.getAttribute('aria-selected') === 'true';
            });
        }

        var nextIndex;
        switch (event.key) {
            case 'ArrowDown':
                nextIndex = (activeIndex + 1) % options.length;
                break;
            case 'ArrowUp':
                nextIndex = (activeIndex + options.length - 1) % options.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = options.length - 1;
                break;
            case 'Enter':
            case ' ':
            case 'Spacebar':
                event.preventDefault();
                if (options[activeIndex]) selectOption(options[activeIndex]);
                return;
            default:
                return;
        }

        event.preventDefault();
        focusOption(options[nextIndex]);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && list.style.display === 'block') {
            event.preventDefault();
            close(true);
        }
    });

    document.addEventListener('click', function (event) {
        if (!picker.contains(event.target)) close(false);
    });

    document.addEventListener('focusin', function (event) {
        if (!picker.contains(event.target)) close(false);
    });
})();
