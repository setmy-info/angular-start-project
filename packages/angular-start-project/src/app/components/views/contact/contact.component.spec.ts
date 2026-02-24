import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ContactComponent} from './contact.component';

describe('ContactComponent', () => {
    let fixture: ComponentFixture<ContactComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ContactComponent);
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

    it('should render contact heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim()).toBe('Contact');
    });

    it('should render contact icons', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icons = el.querySelectorAll('.material-symbols-outlined');
        expect(icons.length).toBeGreaterThan(0);
    });

    it('should render icon panels', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('.iconPanel').length).toBeGreaterThan(0);
    });
});
