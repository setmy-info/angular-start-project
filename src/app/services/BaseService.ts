
export class BaseService {

    constructor(name: string) {
        var win = (window as any);
        if (!win.services) {
            win.services = {
            };
        }
        win.services[name] = this;
    }
}