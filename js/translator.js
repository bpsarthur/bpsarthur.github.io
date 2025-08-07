document.addEventListener('DOMContentLoaded', () => {
    const languageSwitcher = document.querySelector('#language-switcher');
    let translations = {};

    const fetchTranslations = async (lang) => {
        const response = await fetch(`translations/${lang}.json`);
        return await response.json();
    };

    const applyTranslations = () => {
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            if (translations[key]) {
                element.innerHTML = translations[key];
            }
        });
        // Special handling for the typewriter text, as it's dynamically generated
        const typewriterElement = document.getElementById('typewriter');
        if (typewriterElement && translations.typewriter_text) {
            // Cancel any existing typewriter animation
            if (window.typewriterTimeout) {
                clearTimeout(window.typewriterTimeout);
            }
            typewriterElement.innerHTML = ''; // Clear existing text
            // Re-initialize the typewriter animation with the new text
            const text = translations.typewriter_text;
            let i = 0;
            let charIndex = 0;
            const words = text.split("|");

            function typeWriter() {
                if (i < words.length) {
                    if (charIndex < words[i].length) {
                        typewriterElement.innerHTML += words[i].charAt(charIndex);
                        charIndex++;
                        window.typewriterTimeout = setTimeout(typeWriter, 50);
                    } else {
                        i++;
                        charIndex = 0;
                        if (i < words.length) {
                            typewriterElement.innerHTML += " | ";
                            window.typewriterTimeout = setTimeout(typeWriter, 300);
                        }
                    }
                }
            }
            typeWriter();
        }
    };

    const setLanguage = async (lang) => {
        translations = await fetchTranslations(lang);
        applyTranslations();
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
    };

    languageSwitcher.addEventListener('change', (event) => {
        setLanguage(event.target.value);
    });

    const initialLang = localStorage.getItem('language') || navigator.language.split('-')[0] || 'pt';
    languageSwitcher.value = initialLang;
    setLanguage(initialLang);
});
