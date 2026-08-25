import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
    let fixture: ComponentFixture<TermsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TermsComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(TermsComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render article body wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleBody')).toBeTruthy();
    });

    it('should render terms heading for the current language', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });
});
