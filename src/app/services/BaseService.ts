
function getWindow(): any {
    return window;
}

export class BaseService {

    constructor(name: string) {
        var win = getWindow();
        if (!win.services) {
            win.services = {
            };
        }
        win.services[name] = this;
    }
}