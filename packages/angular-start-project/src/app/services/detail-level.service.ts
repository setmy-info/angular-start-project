import { Injectable, computed, signal } from '@angular/core';

/**
 * How much of a page view's text is on screen.
 *
 * The old app did this on the home page with two buttons — "kompaktne" / "detailne" — flipping a
 * `detailsLevel` string, with every optional block wrapped in `<div class="detailed">`. Here the
 * same idea is a numeric scale, so the markup does not have to change as more layers of text are
 * added: level 1 is the compact read, and each step up reveals everything marked for that level
 * and below.
 *
 * The scale is specified up to `MAX_SCALE_LEVEL` (5). `MAX_LEVEL` is how far the slider actually
 * travels today — only levels 1 and 2 carry content — so opening up the rest is a one-line change
 * here plus the `view.detailLevel.level3..5` translations, which already exist.
 *
 * State is per page view and lives as long as the app does: a view declares the level it opens at
 * (its entry default), and once the visitor moves the slider their choice is what that view
 * reopens at when they navigate away and come back.
 */
@Injectable({ providedIn: 'root' })
export class DetailLevelService {
    /** Compact: only the text every reader needs. */
    static readonly MIN_LEVEL = 1;
    /** Highest level the slider offers today. Raise as levels 3..5 gain content. */
    static readonly MAX_LEVEL = 2;
    /** Full width of the scale the `detailLevel` markup contract is written against. */
    static readonly MAX_SCALE_LEVEL = 5;

    // Entry level per view key, declared by the view itself.
    private readonly defaults = signal<ReadonlyMap<string, number>>(new Map());
    // Level the visitor slid to, per view key. Wins over that view's default.
    private readonly selections = signal<ReadonlyMap<string, number>>(new Map());
    // The view whose slider is on screen. Only one page view renders at a time (router-outlet),
    // so content marked with `detailLevel` can be gated without being told which view it is in.
    private readonly activeViewKey = signal<string | null>(null);

    /** Level of the page view currently on screen. */
    readonly activeLevel = computed(() => {
        const viewKey = this.activeViewKey();
        return viewKey === null ? DetailLevelService.MIN_LEVEL : this.levelOf(viewKey);
    });

    /** Level `viewKey` shows: the visitor's own choice if it has one, otherwise its entry default. */
    levelOf(viewKey: string): number {
        return (
            this.selections().get(viewKey) ??
            this.defaults().get(viewKey) ??
            DetailLevelService.MIN_LEVEL
        );
    }

    /**
     * A view opens and declares the level it enters at. The entry default never overwrites a
     * choice the visitor already made on this view — that is what makes the slider position
     * survive navigating away and back.
     */
    registerView(viewKey: string, defaultLevel: number): void {
        this.defaults.update((defaults) =>
            new Map(defaults).set(viewKey, this.clamp(defaultLevel)),
        );
        this.activeViewKey.set(viewKey);
    }

    /** A view closes. Its stored level stays; only "what is on screen" is cleared. */
    releaseView(viewKey: string): void {
        if (this.activeViewKey() === viewKey) {
            this.activeViewKey.set(null);
        }
    }

    /** The visitor moved the slider on `viewKey`. */
    select(viewKey: string, level: number): void {
        this.selections.update((selections) => new Map(selections).set(viewKey, this.clamp(level)));
    }

    /** Whether content marked for `level` belongs on screen in the view showing now. */
    isVisible(level: number): boolean {
        return this.activeLevel() >= level;
    }

    private clamp(level: number): number {
        if (!Number.isFinite(level)) {
            return DetailLevelService.MIN_LEVEL;
        }
        return Math.min(
            Math.max(Math.round(level), DetailLevelService.MIN_LEVEL),
            DetailLevelService.MAX_LEVEL,
        );
    }
}
