import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplatePageComponent } from './template-page.component';
import { DetailLevelService } from '../../../services/detail-level.service';

describe('TemplatePageComponent', () => {
    let fixture: ComponentFixture<TemplatePageComponent>;
    let service: DetailLevelService;

    const detailedBlock = () =>
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.detailed');

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TemplatePageComponent],
        }).compileComponents();
        service = TestBed.inject(DetailLevelService);
        fixture = TestBed.createComponent(TemplatePageComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render article body wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleBody')).toBeTruthy();
    });

    it('should render the detail level slider', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('app-detail-level-panel input[type="range"]')).toBeTruthy();
    });

    it('should open at its entry level with the detailed block hidden', () => {
        expect(service.activeLevel()).toBe(1);
        expect(detailedBlock()?.style.display).toBe('none');
    });

    it('should show the detailed block once the slider is raised to level 2', () => {
        service.select('template', 2);
        fixture.detectChanges();
        expect(detailedBlock()?.style.display).toBe('');
    });
});
