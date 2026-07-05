import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ModalOverlayComponent} from './modal-overlay.component';
import {ModalService} from '../../../services/modal.service';

describe('ModalOverlayComponent', () => {
    let fixture: ComponentFixture<ModalOverlayComponent>;
    let modalService: ModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ModalOverlayComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ModalOverlayComponent);
        modalService = TestBed.inject(ModalService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render modal-overlay element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#modalBody')).toBeTruthy();
    });

    it('should be hidden (class="hidden") when modal is closed', () => {
        modalService.close();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const overlay = el.querySelector('#modalBody') as HTMLElement;
        expect(overlay.classList.contains('hidden')).toBe(true);
    });

    it('should be visible (no "hidden" class) when modal is open', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const overlay = el.querySelector('#modalBody') as HTMLElement;
        expect(overlay.classList.contains('hidden')).toBe(false);
    });

    it('should close modal when overlay is clicked', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const overlay = el.querySelector('#modalBody') as HTMLElement;
        overlay.click();
        expect(modalService.isOpen()).toBe(false);
    });
});
