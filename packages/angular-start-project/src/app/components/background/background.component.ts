import {afterNextRender, ChangeDetectionStrategy, Component, inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

@Component({
    selector: 'app-background',
    templateUrl: './background.component.html',
    styleUrl: './background.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackgroundComponent {
    private readonly platformId = inject(PLATFORM_ID);

    constructor() {
        afterNextRender(async () => {
            if (isPlatformBrowser(this.platformId)) {
                await this.initParticles();
            }
        });
    }

    private async initParticles(): Promise<void> {
        const {tsParticles} = await import('@tsparticles/engine');
        const {loadSlim} = await import('@tsparticles/slim');
        await loadSlim(tsParticles);
        await tsParticles.load({
            id: 'background',
            options: {
                particles: {
                    number: {value: 250},
                    color: {value: '#3E6AA2'},
                    links: {enable: false},
                    move: {enable: true, speed: 0.5},
                    size: {value: {min: 1, max: 3}}
                },
                background: {color: {value: 'transparent'}}
            }
        });
    }
}
