import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ViewNotFoundComponent} from './view-not-found.component';

describe('ViewNotFoundComponent', () => {
    let fixture: ComponentFixture<ViewNotFoundComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewNotFoundComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ViewNotFoundComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render not-found heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h2 = el.querySelector('h2');
        expect(h2).toBeTruthy();
        expect(h2?.textContent).toContain('view-not-found');
    });
});
