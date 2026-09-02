import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ViewNotFoundComponent } from './view-not-found.component';

describe('ViewNotFoundComponent', () => {
    let fixture: ComponentFixture<ViewNotFoundComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewNotFoundComponent],
            providers: [provideRouter([])],
        }).compileComponents();
        fixture = TestBed.createComponent(ViewNotFoundComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the not-found heading as the page h1', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should render a link back home', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('a[href="/"]')).toBeTruthy();
    });
});
