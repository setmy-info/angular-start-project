import { VERSION } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { LocationService } from '../../../services/location.service';

describe('SettingsComponent', () => {
    let fixture: ComponentFixture<SettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SettingsComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(SettingsComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render settings heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should render settings fields as icon/label/text rows, like the contact view', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('.iconPanel').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.labelPanel').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.textPanel').length).toBeGreaterThan(0);
    });

    it('should render a material icon in every settings row', () => {
        const el = fixture.nativeElement as HTMLElement;
        const iconPanels = el.querySelectorAll('.iconPanel');
        iconPanels.forEach((panel) =>
            expect(panel.querySelector('.material-symbols-outlined')).toBeTruthy(),
        );
    });

    it('should report the Angular version the bundle was built against', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain(VERSION.full);
    });

    it('should render no location links or error before a position is known', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('a[href*="google.com/maps"]').length).toBe(0);
        expect(el.querySelectorAll('a[href*="openstreetmap.org"]').length).toBe(0);
    });

    it('should render Google Maps and OpenStreetMap links once a position is set', () => {
        const locationService = TestBed.inject(LocationService);
        locationService.set({ latitude: 59.437, longitude: 24.7536 });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const googleLink = el.querySelector('a[href*="google.com/maps"]') as HTMLAnchorElement;
        const osmLink = el.querySelector('a[href*="openstreetmap.org"]') as HTMLAnchorElement;

        expect(googleLink).toBeTruthy();
        expect(googleLink.href).toContain('59.437');
        expect(googleLink.href).toContain('24.7536');
        expect(osmLink).toBeTruthy();
        expect(osmLink.href).toContain('59.437');
        expect(osmLink.href).toContain('24.7536');
    });

    it('should render the error message when location lookup failed', () => {
        const locationService = TestBed.inject(LocationService);
        locationService.setError('user denied geolocation');
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('user denied geolocation');
        expect(el.querySelectorAll('a[href*="google.com/maps"]').length).toBe(0);
    });
});
