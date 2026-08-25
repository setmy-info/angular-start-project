import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import angularStartProjectLibrary from 'angular-start-project-library';
import { SideNavPanelComponent } from './side-navigation-panel.component';
import { ModalService } from '../../../services/modal.service';

describe('SideNavPanelComponent', () => {
    let fixture: ComponentFixture<SideNavPanelComponent>;
    let modalService: ModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SideNavPanelComponent],
            providers: [provideRouter([])],
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
        expect(el.querySelector('#sideNavigationHeaderPanel')).toBeTruthy();
    });

    it('should render side nav content panel', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#sideNavigationContentPanel')).toBeTruthy();
    });

    it('should render close button', () => {
        const el = fixture.nativeElement as HTMLElement;
        const btn = el.querySelector('button[aria-label="Close navigation menu"]');
        expect(btn).toBeTruthy();
    });

    it('should render one menu item per menuModel entry plus the language item', () => {
        const el = fixture.nativeElement as HTMLElement;
        const items = el.querySelectorAll('li.sideNavMenuItems');
        const menuCount = angularStartProjectLibrary.menuModel.getMenuItems(
            angularStartProjectLibrary.tenantService.getTenant(),
        ).length;
        expect(items.length).toBe(menuCount + 1);
    });

    it('should render menu item icons', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icons = el.querySelectorAll('#sideNavigationContentPanel .material-symbols-outlined');
        expect(icons.length).toBeGreaterThan(0);
    });

    it('should render the language select below the horizontal-rule item', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('li.sideNavThinMenuItems hr')).toBeTruthy();
        const select = el.querySelector('#sideNavigationContentPanel select') as HTMLSelectElement;
        expect(select).toBeTruthy();
        expect(select.querySelectorAll('option').length).toBeGreaterThan(1);
    });

    it('should be hidden (display:none) when modal is closed', () => {
        modalService.close();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const nav = el.querySelector('#sidenav') as HTMLElement;
        expect(nav.style.display).toBe('none');
    });

    it('should be visible (no inline display:none) when modal is open', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const nav = el.querySelector('#sidenav') as HTMLElement;
        expect(nav.style.display).toBe('');
    });

    it('should close the modal when a menu item link is clicked', () => {
        modalService.open();
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        (el.querySelector('li.sideNavMenuItems a') as HTMLAnchorElement).click();
        expect(modalService.isOpen()).toBe(false);
    });
});
