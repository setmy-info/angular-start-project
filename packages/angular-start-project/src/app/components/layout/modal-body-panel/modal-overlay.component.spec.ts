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
        expect(el.querySelector('#modal-overlay')).toBeTruthy();
    });

    it('should be hidden (display:none) when modal is closed', () => {
        modalService.close();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const overlay = el.querySelector('#modal-overlay') as HTMLElement;
        expect(overlay.style.display).toBe('none');
    });

    it('should be visible (display:block) when modal is open', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const overlay = el.querySelector('#modal-overlay') as HTMLElement;
        expect(overlay.style.display).toBe('block');
    });

    it('should close modal when overlay is clicked', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const overlay = el.querySelector('#modal-overlay') as HTMLElement;
        overlay.click();
        expect(modalService.isOpen()).toBe(false);
    });
});
