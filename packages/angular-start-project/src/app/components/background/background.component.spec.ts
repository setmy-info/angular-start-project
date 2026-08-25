import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackgroundComponent } from './background.component';

describe('BackgroundComponent', () => {
    let fixture: ComponentFixture<BackgroundComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BackgroundComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(BackgroundComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render background container element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#background')).toBeTruthy();
    });

    it('should mark background as presentation-only', () => {
        const el = fixture.nativeElement as HTMLElement;
        const bg = el.querySelector('#background');
        expect(bg?.getAttribute('aria-hidden')).toBe('true');
    });
});
