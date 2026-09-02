import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailLevelPanelComponent } from './detail-level-panel.component';
import { DetailLevelService } from '../../services/detail-level.service';

describe('DetailLevelPanelComponent', () => {
    let fixture: ComponentFixture<DetailLevelPanelComponent>;
    let service: DetailLevelService;

    const slider = () =>
        (fixture.nativeElement as HTMLElement).querySelector('input[type="range"]')!;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DetailLevelPanelComponent],
        }).compileComponents();
        service = TestBed.inject(DetailLevelService);
        fixture = TestBed.createComponent(DetailLevelPanelComponent);
        fixture.componentRef.setInput('viewKey', 'panel');
        fixture.componentRef.setInput('defaultLevel', 1);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render a slider spanning the levels currently in use', () => {
        const range = slider() as HTMLInputElement;
        expect(range.min).toBe(String(DetailLevelService.MIN_LEVEL));
        expect(range.max).toBe(String(DetailLevelService.MAX_LEVEL));
        expect(range.step).toBe('1');
    });

    it('should register the view at its entry level', () => {
        expect(service.levelOf('panel')).toBe(1);
        expect(service.activeLevel()).toBe(1);
    });

    it('should start at the level the view already holds, not at the default', () => {
        service.select('panel', 2);
        fixture.detectChanges();
        expect((slider() as HTMLInputElement).value).toBe('2');
    });

    it('should record the level the visitor slides to', () => {
        const range = slider() as HTMLInputElement;
        range.value = '2';
        range.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        expect(service.levelOf('panel')).toBe(2);
    });

    it('should name the current level next to the slider, and rename it as the level changes', () => {
        const el = fixture.nativeElement as HTMLElement;
        const nameAtLevelOne = el.querySelector('.detailsLevelValue')?.textContent?.trim();
        expect(nameAtLevelOne?.length).toBeGreaterThan(0);

        service.select('panel', 2);
        fixture.detectChanges();

        const nameAtLevelTwo = el.querySelector('.detailsLevelValue')?.textContent?.trim();
        expect(nameAtLevelTwo?.length).toBeGreaterThan(0);
        expect(nameAtLevelTwo).not.toBe(nameAtLevelOne);
    });

    it('should release the view when it is destroyed', () => {
        service.select('panel', 2);
        fixture.destroy();
        expect(service.activeLevel()).toBe(DetailLevelService.MIN_LEVEL);
        expect(service.levelOf('panel')).toBe(2);
    });
});
