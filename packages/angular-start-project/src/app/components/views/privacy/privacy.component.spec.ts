import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {PrivacyComponent} from './privacy.component';

describe('PrivacyComponent', () => {
    let fixture: ComponentFixture<PrivacyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PrivacyComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(PrivacyComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render article body wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleBody')).toBeTruthy();
    });

    it('should render privacy heading for the current language', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should render the cookie consent checkbox', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('input[type="checkbox"]')).toBeTruthy();
    });

    it('should toggle consent when the checkbox changes', () => {
        const el = fixture.nativeElement as HTMLElement;
        const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        expect(fixture.componentInstance['consentService'].hasConsented()).toBe(true);

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));
        expect(fixture.componentInstance['consentService'].hasConsented()).toBe(false);
    });
});
