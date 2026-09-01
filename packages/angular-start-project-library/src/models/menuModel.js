// Menu catalog with per-tenant menu sets — selected via systemsService.getTenant() (hostname map).
// `header: false` keeps an item out of the top header menu while still showing it in the side
// navigation (hamburger) menu.
const systemsService = require('../services/systemsService');

const ALL_MENUS = {
    HOME: { id: 1, path: '/', label: 'Home', icon: 'home', translationKey: 'menu.home' },
    ARTICLES: {
        id: 2,
        path: '/articles',
        label: 'Articles',
        icon: 'article',
        translationKey: 'menu.articles',
    },
    PRODUCTS_SERVICES: {
        id: 7,
        path: '/productsServices',
        label: 'Products and services',
        icon: 'store',
        translationKey: 'menu.productsServices',
    },
    ABOUT: { id: 5, path: '/about', label: 'About', icon: 'info', translationKey: 'menu.about' },
    CONTACT: {
        id: 3,
        path: '/contact',
        label: 'Contact',
        icon: 'contact_page',
        translationKey: 'menu.contact',
    },
    TERMS: {
        id: 6,
        path: '/terms',
        label: 'Terms of use',
        icon: 'gavel',
        translationKey: 'menu.terms',
        header: false,
    },
    SETTINGS: {
        id: 4,
        path: '/settings',
        label: 'Settings',
        icon: 'settings',
        translationKey: 'menu.settings',
        header: false,
    },
};

// tenant1: articles-focused (old ngo-shaped set). tenant2: products/services-focused (old llc).
const TENANT_MENUS = {
    [systemsService.TENANT1]: [
        ALL_MENUS.HOME,
        ALL_MENUS.ARTICLES,
        ALL_MENUS.CONTACT,
        ALL_MENUS.TERMS,
    ],
    [systemsService.TENANT2]: [
        ALL_MENUS.HOME,
        ALL_MENUS.PRODUCTS_SERVICES,
        ALL_MENUS.CONTACT,
        ALL_MENUS.TERMS,
    ],
};

const menuItems = TENANT_MENUS[systemsService.DEFAULT_TENANT];

module.exports = {
    default: menuItems,
    ALL_MENUS: ALL_MENUS,
    getMenuItems: function (tenant) {
        return TENANT_MENUS[tenant] || TENANT_MENUS[systemsService.DEFAULT_TENANT];
    },
};
