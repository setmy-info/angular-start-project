import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {SideNavPanelComponent} from './side-navigation-panel.component';
import {ModalService} from '../../../services/modal.service';

describe('SideNavPanelComponent', () => {
    let fixture: ComponentFixture<SideNavPanelComponent>;
    let modalService: ModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SideNavPanelComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(SideNavPanelComponent);
        modalService = TestBed.inject(ModalService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render sidenav container', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#sidenav')).toBeTruthy();
    });

    it('should render side nav header panel', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#side-nav-header-panel')).toBeTruthy();
    });

    it('should render side nav content panel', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#side-nav-content-panel')).toBeTruthy();
    });

    it('should render close button', () => {
        const el = fixture.nativeElement as HTMLElement;
        const btn = el.querySelector('button[aria-label="Close navigation menu"]');
        expect(btn).toBeTruthy();
    });

    it('should render menu items', () => {
        const el = fixture.nativeElement as HTMLElement;
        const items = el.querySelectorAll('.sideNavMenuItems');
        expect(items.length).toBeGreaterThan(0);
    });

    it('should render menu item icons', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icons = el.querySelectorAll('#side-nav-content-panel .material-symbols-outlined');
        expect(icons.length).toBeGreaterThan(0);
    });

    it('should be hidden (display:none) when modal is closed', () => {
        modalService.close();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const nav = el.querySelector('#sidenav') as HTMLElement;
        expect(nav.style.display).toBe('none');
    });

    it('should be visible (display:flex) when modal is open', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const nav = el.querySelector('#sidenav') as HTMLElement;
        expect(nav.style.display).toBe('flex');
    });
});
