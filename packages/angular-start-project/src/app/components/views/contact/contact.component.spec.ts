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

    it('should render article body wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleBody')).toBeTruthy();
    });

    it('should render contact heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should render contact fields as icon/label/text rows', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('.iconPanel').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.labelPanel').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.textPanel').length).toBeGreaterThan(0);
    });

    it('should render a material icon in every icon panel', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icons = el.querySelectorAll('.iconPanel .material-symbols-outlined');
        expect(icons.length).toBe(el.querySelectorAll('.iconPanel').length);
    });
});
