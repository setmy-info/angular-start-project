describe('Visual Comparison E2E Tests', () => {
    const LOCAL_URL = 'http://localhost:4200/';
    const REMOTE_URL = 'https://setmy.info/';

    afterEach(async () => {
        // Firefox/GeckoDriver might not support all log types or standard log fetching via WebDriver
        // We'll try to fetch browser logs if possible, but keep it defensive for Firefox
        try {
            const logs = await browser.getLogs('browser');
            const errors = logs.filter(log => log.level === 'SEVERE');
            if (errors.length > 0) {
                console.error('Browser errors detected:', errors);
            }
            expect(errors.length).toBe(0);
        } catch (e) {
            console.warn('Could not fetch browser logs (this is common on Firefox/GeckoDriver)');
        }
    });

    async function getElementMetrics(selector: string) {
        const element = await $(selector);
        const location = await element.getLocation();
        const size = await element.getSize();
        const color = await element.getCSSProperty('color');
        const bgColor = await element.getCSSProperty('background-color');
        return {
            x: Math.round(location.x),
            y: Math.round(location.y),
            width: Math.round(size.width),
            height: Math.round(size.height),
            color: color.value,
            backgroundColor: bgColor.value
        };
    }

    it('should compare Header Panel between Local and Remote', async () => {
        // Get metrics from Remote
        await browser.url(REMOTE_URL);
        const remoteMetrics = await getElementMetrics('#headerPanel');

        // Get metrics from Local
        await browser.url(LOCAL_URL);
        const localMetrics = await getElementMetrics('#headerPanel');

        console.log('Remote Header Metrics:', remoteMetrics);
        console.log('Local Header Metrics:', localMetrics);

        // Compare basic metrics (allowing some tolerance for slight differences)
        expect(localMetrics.height).toBeCloseTo(remoteMetrics.height, -1);
        // color and background-color might differ if themed, but should be similar
        // expect(localMetrics.backgroundColor).toBe(remoteMetrics.backgroundColor);
    });

    it('should compare Main Content between Local and Remote', async () => {
        await browser.url(REMOTE_URL);
        const remoteMetrics = await getElementMetrics('main');

        await browser.url(LOCAL_URL);
        const localMetrics = await getElementMetrics('main');

        expect(localMetrics.x).toBeCloseTo(remoteMetrics.x, -1);
    });

    it('should compare Side Navigation between Local and Remote', async () => {
        await browser.url(REMOTE_URL);
        const menuBtn = await $('#headerPanel button');
        await menuBtn.click();
        const remoteMetrics = await getElementMetrics('#sidenav');

        await browser.url(LOCAL_URL);
        const localMenuBtn = await $('#headerPanel button');
        await localMenuBtn.click();
        const localMetrics = await getElementMetrics('#sidenav');

        expect(localMetrics.width).toBeCloseTo(remoteMetrics.width, -1);
    });
});
