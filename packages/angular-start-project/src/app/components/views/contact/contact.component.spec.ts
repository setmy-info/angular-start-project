import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
    let fixture: ComponentFixture<ContactComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactComponent],
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

    it('should render contact fields as icon/label/text rows', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('.iconPanel').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.labelPanel').length).toBeGreaterThan(0);
        expect(el.querySelectorAll('.textPanel').length).toBeGreaterThan(0);
    });

    it('should render material icons in icon panels (continuation rows may be empty, like the old app)', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icons = el.querySelectorAll('.iconPanel .material-symbols-outlined');
        expect(icons.length).toBeGreaterThan(0);
        expect(icons.length).toBeLessThanOrEqual(el.querySelectorAll('.iconPanel').length);
    });

    it('should hide the feature-gated bank rows while the bankAccounts flag is off', () => {
        const el = fixture.nativeElement as HTMLElement;
        const bankRows = el.querySelectorAll('[feature="bankAccounts"]');
        expect(bankRows.length).toBe(3);
        bankRows.forEach((row) => expect((row as HTMLElement).style.display).toBe('none'));
    });
});
