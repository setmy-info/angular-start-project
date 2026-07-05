import {Injectable, signal} from '@angular/core';
import angularStartProjectLibrary from 'angular-start-project-library';

@Injectable({providedIn: 'root'})
export class ConsentService {
    readonly hasConsented = signal<boolean>(angularStartProjectLibrary.consentService.hasConsented());

    accept(): void {
        angularStartProjectLibrary.consentService.grantConsent();
        this.hasConsented.set(true);
    }
}
