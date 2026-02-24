const tenantService = {
    getTenant: function () {
        if (typeof window === 'undefined' || !window.location) {
            return 'default';
        }
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'default';
        }
        // Example: blog.setmy.info -> tenant 'blog'
        // setmy.info -> tenant 'root' (brand page)
        const parts = hostname.split('.');
        if (parts.length <= 2) {
            return 'root';
        }
        return parts[0];
    },
    isBrandPage: function () {
        return this.getTenant() === 'root';
    }
};

module.exports = tenantService;
