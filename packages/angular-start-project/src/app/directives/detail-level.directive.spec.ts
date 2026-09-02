import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailLevelDirective } from './detail-level.directive';
import { DetailLevelService } from '../services/detail-level.service';

@Component({
    imports: [DetailLevelDirective],
    template: `
        <p id="always">always</p>
        <div id="deeper" class="detailed" detailLevel="2">deeper</div>
    `,
})
class HostComponent {}

describe('DetailLevelDirective', () => {
    let fixture: ComponentFixture<HostComponent>;
    let service: DetailLevelService;

    const displayOf = (id: string) =>
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`#${id}`)?.style.display;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        service = TestBed.inject(DetailLevelService);
        service.registerView('host', 1);
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
    });

    it('should hide content above the active level', () => {
        expect(displayOf('deeper')).toBe('none');
        expect(displayOf('always')).toBe('');
    });

    it('should reveal that content once the level is raised', () => {
        service.select('host', 2);
        fixture.detectChanges();
        expect(displayOf('deeper')).toBe('');
    });

    it('should hide it again when the level is lowered', () => {
        service.select('host', 2);
        fixture.detectChanges();
        service.select('host', 1);
        fixture.detectChanges();
        expect(displayOf('deeper')).toBe('none');
    });
});
