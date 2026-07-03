import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {HeaderPanelComponent} from './header-panel.component';

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

    it('should render menu toggle button', () => {
        const el = fixture.nativeElement as HTMLElement;
        const btn = el.querySelector('button i.material-symbols-outlined');
        expect(btn).toBeTruthy();
    });

    it('should render menu icon in toggle button', () => {
        const el = fixture.nativeElement as HTMLElement;
        const icon = el.querySelector('i.material-symbols-outlined');
        expect(icon).toBeTruthy();
        expect(icon?.textContent?.trim()).toBe('menu');
    });

    it('should render at least one navigation link', () => {
        const el = fixture.nativeElement as HTMLElement;
        const links = el.querySelectorAll('nav a');
        expect(links.length).toBeGreaterThan(0);
    });

    it('should render language buttons', () => {
        const el = fixture.nativeElement as HTMLElement;
        const langButtons = el.querySelectorAll('header ul:last-child button');
        expect(langButtons.length).toBeGreaterThan(0);
    });
});
