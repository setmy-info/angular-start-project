import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {ExampleComponent} from './example.component';

describe('ExampleComponent', () => {
    let component: ExampleComponent;
    let fixture: ComponentFixture<ExampleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExampleComponent],
            providers: [provideRouter([])]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ExampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
