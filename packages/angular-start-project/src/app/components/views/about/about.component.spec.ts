import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AboutComponent} from './about.component';

describe('AboutComponent', () => {
    let fixture: ComponentFixture<AboutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AboutComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(AboutComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render applicationContentMain wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.applicationContentMain')).toBeTruthy();
    });

    it('should render article element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('article')).toBeTruthy();
    });

    it('should render section header picture', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.sectionHeaderPicture')).toBeTruthy();
    });

    it('should render about heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim()).toBe('About');
    });

    it('should render at least two sections', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('section').length).toBeGreaterThanOrEqual(1);
    });
});
