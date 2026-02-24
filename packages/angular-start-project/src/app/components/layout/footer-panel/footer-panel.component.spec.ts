import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FooterPanelComponent} from './footer-panel.component';

describe('FooterPanelComponent', () => {
    let fixture: ComponentFixture<FooterPanelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FooterPanelComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(FooterPanelComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render footer element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('footer')).toBeTruthy();
    });

    it('should render copyright icon', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icon = el.querySelector('.material-symbols-outlined');
        expect(icon).toBeTruthy();
        expect(icon?.textContent?.trim()).toBe('copyright');
    });

    it('should render footer text content', () => {
        const el = fixture.nativeElement as HTMLElement;
        const text = el.querySelector('footer')?.textContent ?? '';
        expect(text).toContain('Lorem Ipsum');
    });
});
