document.addEventListener('DOMContentLoaded', () => {
    const languageSwitcher = document.querySelector('#language-switcher');
    let translations = {};

    const fetchTranslations = async (lang) => {
        const response = await fetch(`translations/${lang}.json`);
        return await response.json();
    };

    const fetchCVEs = async () => {
        const cveContainer = document.getElementById('cve-container');
        if (!cveContainer) return; // Don't run if the container doesn't exist

        // Set loading message using translation
        cveContainer.innerHTML = `<p class="text-center text-accent">${translations.cves_loading || 'Loading...'}</p>`;

        try {
            const now = new Date();
            const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

            const formatDate = (date) => date.toISOString().slice(0, -5) + 'Z';

            const pubStartDate = formatDate(fifteenDaysAgo);
            const pubEndDate = formatDate(now);

            const apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}`;

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`NVD API responded with status: ${response.status}`);
            }
            const data = await response.json();

            cveContainer.innerHTML = ''; // Clear loading message

            if (data.vulnerabilities && data.vulnerabilities.length > 0) {
                const latestCVEs = data.vulnerabilities.reverse().slice(0, 5);

                latestCVEs.forEach(item => {
                    const cve = item.cve;
                    const cveId = cve.id;
                    const description = cve.descriptions.find(d => d.lang === 'en').value;

                    let severity = 'N/A';
                    let score = '';
                    let severityColorClass = 'bg-gray-500';

                    if (cve.metrics.cvssMetricV31 && cve.metrics.cvssMetricV31.length > 0) {
                        const cvssV31 = cve.metrics.cvssMetricV31[0];
                        score = cvssV31.cvssData.baseScore;
                        severity = cvssV31.cvssData.baseSeverity;

                        switch (severity) {
                            case 'CRITICAL': severityColorClass = 'bg-red-700'; break;
                            case 'HIGH': severityColorClass = 'bg-orange-600'; break;
                            case 'MEDIUM': severityColorClass = 'bg-yellow-500'; break;
                            case 'LOW': severityColorClass = 'bg-green-600'; break;
                        }
                    }

                    const cveCard = `
                        <div class="bg-darkgray p-6 rounded-lg border-l-4 border-accent transform transition-all hover:-translate-y-1">
                            <div class="flex justify-between items-center mb-2 flex-wrap">
                                <h4 class="text-xl font-bold text-accent mr-4">${cveId}</h4>
                                <span class="px-3 py-1 text-sm font-bold rounded-full text-dark ${severityColorClass}">
                                    ${severity} ${score ? `(${score})` : ''}
                                </span>
                            </div>
                            <p class="opacity-80 mt-2">${description.substring(0, 280)}...</p>
                            <a href="https://nvd.nist.gov/vuln/detail/${cveId}" target="_blank" class="text-accent hover:underline mt-2 inline-block">${translations.cve_details_link || 'View details &rarr;'}</a>
                        </div>
                    `;
                    cveContainer.innerHTML += cveCard;
                });
            } else {
                cveContainer.innerHTML = `<p class="text-center">${translations.cves_no_data || 'No recent vulnerabilities found.'}</p>`;
            }
        } catch (error) {
            console.error("Failed to fetch CVEs:", error);
            cveContainer.innerHTML = `<p class="text-center text-red-500">${translations.cves_error || 'Failed to load CVE data.'}</p>`;
        }
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
            if (window.typewriterTimeout) {
                clearTimeout(window.typewriterTimeout);
            }
            typewriterElement.innerHTML = ''; // Clear existing text
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
        // Fetch CVEs after translations are ready
        fetchCVEs();
    };

    languageSwitcher.addEventListener('change', (event) => {
        setLanguage(event.target.value);
    });

    const initialLang = localStorage.getItem('language') || navigator.language.split('-')[0] || 'pt';
    languageSwitcher.value = initialLang;
    setLanguage(initialLang);
});
