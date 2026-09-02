import { TestBed } from '@angular/core/testing';
import { DetailLevelService } from './detail-level.service';

describe('DetailLevelService', () => {
    let service: DetailLevelService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DetailLevelService);
    });

    it('should open a view at the level it declares', () => {
        service.registerView('home', 2);
        expect(service.levelOf('home')).toBe(2);
        expect(service.activeLevel()).toBe(2);
    });

    it('should fall back to the minimum level for a view that never registered', () => {
        expect(service.levelOf('unknown')).toBe(DetailLevelService.MIN_LEVEL);
    });

    it('should let a selection win over the entry default', () => {
        service.registerView('home', 1);
        service.select('home', 2);
        expect(service.activeLevel()).toBe(2);
    });

    it('should keep the selected level when the view is left and entered again', () => {
        service.registerView('home', 1);
        service.select('home', 2);

        // navigate away…
        service.releaseView('home');
        expect(service.activeLevel()).toBe(DetailLevelService.MIN_LEVEL);

        // …and back: the entry default must not overwrite what the visitor chose
        service.registerView('home', 1);
        expect(service.activeLevel()).toBe(2);
    });

    it('should keep levels apart per view', () => {
        service.registerView('home', 1);
        service.select('home', 2);
        service.releaseView('home');
        service.registerView('template', 1);
        expect(service.activeLevel()).toBe(1);
        expect(service.levelOf('home')).toBe(2);
    });

    it('should clamp levels outside the supported range', () => {
        service.registerView('home', 99);
        expect(service.levelOf('home')).toBe(DetailLevelService.MAX_LEVEL);
        service.select('home', 0);
        expect(service.levelOf('home')).toBe(DetailLevelService.MIN_LEVEL);
        service.select('home', Number.NaN);
        expect(service.levelOf('home')).toBe(DetailLevelService.MIN_LEVEL);
    });

    it('should show content up to the active level and hide the rest', () => {
        service.registerView('home', 1);
        expect(service.isVisible(1)).toBe(true);
        expect(service.isVisible(2)).toBe(false);
        service.select('home', 2);
        expect(service.isVisible(1)).toBe(true);
        expect(service.isVisible(2)).toBe(true);
    });

    it('should not release the active view when another view is released', () => {
        service.registerView('home', 2);
        service.releaseView('template');
        expect(service.activeLevel()).toBe(2);
    });
});
