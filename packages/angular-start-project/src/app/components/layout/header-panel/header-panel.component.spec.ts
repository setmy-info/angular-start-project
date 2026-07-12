import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import angularStartProjectLibrary from 'angular-start-project-library';
import {HeaderPanelComponent} from './header-panel.component';
import {NetworkService} from '../../../services/network.service';

describe('HeaderPanelComponent', () => {
    let fixture: ComponentFixture<HeaderPanelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HeaderPanelComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(HeaderPanelComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render header-panel container', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('#headerPanel')).toBeTruthy();
    });

    it('should render header element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('header')).toBeTruthy();
    });

    it('should render nav element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('nav')).toBeTruthy();
    });

    it('should render menu toggle button with the menu icon', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icon = el.querySelector('header ul:first-child li:first-child button i');
        expect(icon).toBeTruthy();
        expect(icon?.textContent?.trim()).toBe('menu');
    });

    it('should render one nav link per header menu item (items with header:false excluded)', () => {
        const el = fixture.nativeElement as HTMLElement;
        const links = el.querySelectorAll('nav a');
        const headerMenuCount = angularStartProjectLibrary.menuModel.getMenuItems(
            angularStartProjectLibrary.tenantService.getTenant()
        ).filter((item: {header?: boolean}) => item.header !== false).length;
        expect(links.length).toBe(headerMenuCount);
    });

    it('should render one language button per supported language, current one disabled', () => {
        const el = fixture.nativeElement as HTMLElement;
        const langButtons = el.querySelectorAll('header ul:last-child button');
        const supported = angularStartProjectLibrary.translationService.getSupportedLanguages();
        expect(langButtons.length).toBe(supported.length);
        expect(el.querySelectorAll('header ul:last-child button[disabled]').length).toBe(1);
    });

    it('hides the offline indicator while online', () => {
        const networkService = TestBed.inject(NetworkService);
        networkService.isOnline.set(true);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const offlineItem = el.querySelector('i.alertMaterialIcon')?.closest('li');
        expect(offlineItem?.classList.contains('hidden')).toBe(true);
    });

    it('shows the offline indicator while offline', () => {
        const networkService = TestBed.inject(NetworkService);
        networkService.isOnline.set(false);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const offlineItem = el.querySelector('i.alertMaterialIcon')?.closest('li');
        expect(offlineItem?.classList.contains('hidden')).toBe(false);
        expect(offlineItem?.querySelector('button')?.hasAttribute('disabled')).toBe(true);
    });
});
