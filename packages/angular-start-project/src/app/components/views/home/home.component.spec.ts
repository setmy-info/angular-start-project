import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { DetailLevelService } from '../../../services/detail-level.service';

describe('HomeComponent', () => {
    let fixture: ComponentFixture<HomeComponent>;
    let detailLevelService: DetailLevelService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HomeComponent],
        }).compileComponents();
        detailLevelService = TestBed.inject(DetailLevelService);
        fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render article body wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleBody')).toBeTruthy();
    });

    it('should render main heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should render placeholder image', () => {
        const el = fixture.nativeElement as HTMLElement;
        const img = el.querySelector('img');
        expect(img?.getAttribute('src')).toContain('placeholder.svg');
    });

    it('should render at least one paragraph', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('p').length).toBeGreaterThan(0);
    });

    it('should open compact, with the level 2 block hidden', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(detailLevelService.activeLevel()).toBe(1);
        expect(el.querySelector<HTMLElement>('.detailed')?.style.display).toBe('none');
    });

    it('should reveal the level 2 block when the slider is moved', () => {
        const el = fixture.nativeElement as HTMLElement;
        detailLevelService.select('home', 2);
        fixture.detectChanges();
        expect(el.querySelector<HTMLElement>('.detailed')?.style.display).toBe('');
    });
});
