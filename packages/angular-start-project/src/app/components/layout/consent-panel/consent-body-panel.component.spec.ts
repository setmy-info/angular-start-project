import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {ConsentBodyPanelComponent} from './consent-body-panel.component';

describe('ConsentBodyPanelComponent', () => {
    let fixture: ComponentFixture<ConsentBodyPanelComponent>;

    beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [ConsentBodyPanelComponent],
            providers: [provideRouter([])]
        }).compileComponents();
        fixture = TestBed.createComponent(ConsentBodyPanelComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should be visible (display:"") when consent has not been given', () => {
        const el = fixture.nativeElement as HTMLElement;
        const panel = el.querySelector('#consentBody') as HTMLElement;
        expect(panel.style.display).toBe('');
    });

    it('should hide and persist consent when the accept button is clicked', () => {
        const el = fixture.nativeElement as HTMLElement;
        const button = el.querySelector('#consentBody button') as HTMLButtonElement;
        button.click();
        fixture.detectChanges();
        const panel = el.querySelector('#consentBody') as HTMLElement;
        expect(panel.style.display).toBe('none');
        expect(JSON.parse(localStorage.getItem('consent') ?? '{}').forCookieUsage).toBe(true);
    });
});
