const translations = {
    et: {
        'app.title': 'Lorem Ipsum Rakendus',
        'app.brandTitle': 'Setmy.info Brändileht',
        'menu.home': 'Avaleht',
        'menu.about': 'Meist',
        'menu.contact': 'Kontakt',
        'view.notfound': 'Lehte ei leitud',
        'view.home.welcome': 'Tere tulemast Angular Start Projekti',
        'view.home.description': 'See on üldine alustusprojekti mall. See kasutab Angular 21 signaalide ja standalone komponentidega.',
        'view.home.lorem': 'Lõuna-Aafrika Vabariik on riik Aafrika lõunatipus. See piirneb põhjas Namiibia, Botswana ja Zimbabwe ning kirdes Mosambiigi ja Svaasimaaga.',
        'view.about.title': 'Meist',
        'view.contact.title': 'Võta meiega ühendust',
        'view.contact.organisation': 'Asutus:',
        'view.contact.address': 'Aadress:',
        'view.contact.phone': 'Telefon:',
        'view.contact.email': 'E-post:',
        'view.menu': 'Menüü',
        'view.language': 'Keel'
    },
    en: {
        'app.title': 'Lorem Ipsum Application',
        'app.brandTitle': 'Setmy.info Brand Page',
        'menu.home': 'Home',
        'menu.about': 'About',
        'menu.contact': 'Contact',
        'view.notfound': 'Page Not Found',
        'view.home.welcome': 'Welcome to Angular Start Project',
        'view.home.description': 'This is a generic starter project template. It uses Angular 21 with signals and standalone components.',
        'view.home.lorem': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'view.about.title': 'About Us',
        'view.contact.title': 'Contact Us',
        'view.contact.organisation': 'Organisation:',
        'view.contact.address': 'Address:',
        'view.contact.phone': 'Phone:',
        'view.contact.email': 'Email:',
        'view.menu': 'Menu',
        'view.language': 'Language'
    }
};

const translationService = {
    getTranslations: function (lang) {
        return translations[lang] || translations['en'];
    },
    getTranslation: function (lang, key) {
        const langTranslations = this.getTranslations(lang);
        return langTranslations[key] || key;
    },
    getSupportedLanguages: function () {
        return Object.keys(translations).map(code => ({
            code: code,
            label: code.toUpperCase()
        }));
    }
};

module.exports = translationService;
