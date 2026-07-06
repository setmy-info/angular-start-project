import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {ArticlesComponent} from './articles.component';

describe('ArticlesComponent', () => {
    let fixture: ComponentFixture<ArticlesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ArticlesComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(ArticlesComponent);
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

    it('should render example article items', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('.articleListItem').length).toBe(3);
    });
});
