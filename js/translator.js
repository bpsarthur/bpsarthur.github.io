document.addEventListener('DOMContentLoaded', () => {
    const languageSwitcher = document.querySelector('#language-switcher');
    const supportedLanguages = ['pt', 'en', 'es', 'ru'];

    const storage = {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                console.warn('Unable to access localStorage.getItem:', error);
                return null;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.warn('Unable to access localStorage.setItem:', error);
            }
        }
    };

    const translator = {
        supportedLanguages,
        translations: {},
        currentLanguage: null,
        pendingLanguage: null,
        isLoading: false,
        typewriterTimeout: null,

        normalizeLanguage(lang) {
            if (!lang) {
                return 'pt';
            }
            const lowered = lang.toLowerCase();
            if (this.supportedLanguages.includes(lowered)) {
                return lowered;
            }
            const short = lowered.split('-')[0];
            return this.supportedLanguages.includes(short) ? short : 'pt';
        },

        async fetchTranslations(lang) {
            const response = await fetch(`translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch translations for "${lang}". Status: ${response.status}`);
            }
            return response.json();
        },

        async setLanguage(lang, skipFallback = false) {
            const normalized = this.normalizeLanguage(lang);

            if (this.isLoading && normalized === (this.pendingLanguage || this.currentLanguage)) {
                return;
            }

            this.pendingLanguage = normalized;
            this.isLoading = true;
            const previousLanguage = this.currentLanguage;

            try {
                this.translations = await this.fetchTranslations(normalized);
                this.currentLanguage = normalized;
                document.documentElement.lang = normalized;
                storage.set('language', normalized);

                if (languageSwitcher && languageSwitcher.value !== normalized) {
                    languageSwitcher.value = normalized;
                }

                this.applyTranslations();

                if (previousLanguage !== normalized) {
                    this.notifyLanguageChange();
                }
            } catch (error) {
                console.error(`Failed to load translations for "${normalized}"`, error);
                if (!skipFallback && normalized !== 'pt') {
                    console.warn('Falling back to Portuguese translations.');
                    await this.setLanguage('pt', true);
                }
            } finally {
                this.isLoading = false;
                this.pendingLanguage = null;
            }
        },

        async loadTranslations(lang = this.currentLanguage || 'pt') {
            const normalized = this.normalizeLanguage(lang);

            if (this.isLoading) {
                const targetLanguage = this.pendingLanguage || this.currentLanguage;
                if (normalized === targetLanguage) {
                    return;
                }
            }

            if (normalized !== this.currentLanguage || !Object.keys(this.translations).length) {
                await this.setLanguage(normalized);
                return;
            }

            this.applyTranslations();
        },

        applyTranslations() {
            document.querySelectorAll('[data-i18n-key]').forEach((element) => {
                const key = element.getAttribute('data-i18n-key');
                if (key && this.translations[key]) {
                    element.innerHTML = this.translations[key];
                }
            });
            this.updateTypewriter();
        },

        updateTypewriter() {
            const typewriterElement = document.getElementById('typewriter');
            if (!typewriterElement || !this.translations.typewriter_text) {
                return;
            }

            if (this.typewriterTimeout) {
                clearTimeout(this.typewriterTimeout);
            }

            typewriterElement.innerHTML = '';
            const words = this.translations.typewriter_text.split('|');
            let wordIndex = 0;
            let charIndex = 0;

            const type = () => {
                if (wordIndex >= words.length) {
                    return;
                }

                if (charIndex < words[wordIndex].length) {
                    typewriterElement.innerHTML += words[wordIndex].charAt(charIndex);
                    charIndex += 1;
                    this.typewriterTimeout = setTimeout(type, 50);
                } else {
                    wordIndex += 1;
                    charIndex = 0;
                    if (wordIndex < words.length) {
                        typewriterElement.innerHTML += ' | ';
                        this.typewriterTimeout = setTimeout(type, 300);
                    }
                }
            };

            type();
        },

        notifyLanguageChange() {
            document.dispatchEvent(new CustomEvent('app:languageChanged', {
                detail: { lang: this.currentLanguage }
            }));
        }
    };

    window.translator = translator;

    const preferredLang = translator.normalizeLanguage(storage.get('language') || navigator.language || 'pt');

    if (languageSwitcher) {
        languageSwitcher.value = preferredLang;
        languageSwitcher.addEventListener('change', (event) => {
            translator.setLanguage(event.target.value);
        });
    }

    translator.setLanguage(preferredLang);
});
