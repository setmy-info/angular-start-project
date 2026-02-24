import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {App} from './app';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter([])]
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render application container', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#application')).toBeTruthy();
    });

    it('should render header panel element', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('app-header-panel')).toBeTruthy();
    });

    it('should render footer panel element', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('app-footer-panel')).toBeTruthy();
    });

    it('should render side nav panel element', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('app-side-nav-panel')).toBeTruthy();
    });

    it('should render modal overlay element', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('app-modal-overlay')).toBeTruthy();
    });

    it('should render background element', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('app-background')).toBeTruthy();
    });
});
