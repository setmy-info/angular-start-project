// Menu catalog with per-tenant menu sets — the new-solution equivalent of the old library's
// menuService.js ALL_MENUS + ngo*/llc* sets (there the "tenant" was the system: ngo vs llc,
// selected by hostname; here it is tenantService.getTenant()). `header: false` keeps an item out
// of the top header menu while still showing it in the side navigation (hamburger) menu.
const ALL_MENUS = {
    HOME: { id: 1, path: '/', label: 'Home', icon: 'home', translationKey: 'menu.home' },
    ABOUT: { id: 5, path: '/about', label: 'About', icon: 'info', translationKey: 'menu.about' },
    CONTACT: {
        id: 3,
        path: '/contact',
        label: 'Contact',
        icon: 'contact_page',
        translationKey: 'menu.contact',
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

const TENANT_MENUS = {
    // Webapp default (localhost and unknown hosts)
    default: [ALL_MENUS.HOME, ALL_MENUS.CONTACT, ALL_MENUS.SETTINGS],
    // Brand/root page tenant (apex domain) — same set for now; adjust per deployment
    root: [ALL_MENUS.HOME, ALL_MENUS.CONTACT, ALL_MENUS.SETTINGS],
};

const menuItems = TENANT_MENUS.default;

module.exports = {
    default: menuItems,
    ALL_MENUS: ALL_MENUS,
    getMenuItems: function (tenant) {
        return TENANT_MENUS[tenant] || TENANT_MENUS.default;
    },
};
