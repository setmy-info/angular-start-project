import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
    let fixture: ComponentFixture<AboutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AboutComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(AboutComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render article body wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleBody')).toBeTruthy();
    });

    it('should render about heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should render placeholder image', () => {
        const el = fixture.nativeElement as HTMLElement;
        const img = el.querySelector('img');
        expect(img?.getAttribute('src')).toContain('placeholder.svg');
    });
});
