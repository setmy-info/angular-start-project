import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SettingsComponent} from './settings.component';

describe('SettingsComponent', () => {
    let fixture: ComponentFixture<SettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SettingsComponent]
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

    it('should render settings fields as a definition list', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('.definitionTerm').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.definitionDesc').length).toBeGreaterThan(0);
    });
});
