import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HomeComponent} from './home.component';

describe('HomeComponent', () => {
    let fixture: ComponentFixture<HomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HomeComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(HomeComponent);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render applicationContentMain wrapper', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.applicationContentMain')).toBeTruthy();
    });

    it('should render article element', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('article')).toBeTruthy();
    });

    it('should render section header picture', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.sectionHeaderPicture')).toBeTruthy();
    });

    it('should render article section panel', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.articleSectionPanel')).toBeTruthy();
    });

    it('should render at least one section', () => {
        const el = fixture.nativeElement as HTMLElement;
        const sections = el.querySelectorAll('section');
        expect(sections.length).toBeGreaterThan(0);
    });

    it('should render main heading', () => {
        const el = fixture.nativeElement as HTMLElement;
        const h1 = el.querySelector('h1');
        expect(h1).toBeTruthy();
        expect(h1?.textContent).toContain('Lorem Ipsum');
    });

    it('should render introductory paragraph', () => {
        const el = fixture.nativeElement as HTMLElement;
        const paragraphs = el.querySelectorAll('p');
        expect(paragraphs.length).toBeGreaterThan(0);
    });
});
