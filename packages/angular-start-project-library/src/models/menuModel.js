const menuItems = [
    {id: 1, path: '/', label: 'Home', icon: 'home', translationKey: 'menu.home'},
    {id: 2, path: '/articles', label: 'Articles', icon: 'library_books', translationKey: 'menu.articles'},
    {id: 3, path: '/contact', label: 'Contact', icon: 'contact_page', translationKey: 'menu.contact'},
    {id: 4, path: '/terms', label: 'Terms of use', icon: 'gavel', translationKey: 'menu.terms', header: false}
];

module.exports = {default: menuItems};
