import {Component, OnInit} from '@angular/core';
import {Observable, switchMap} from "rxjs";
import {Example} from "../../../../models/Example";
import { ActivatedRoute, Router } from '@angular/router';
import { ExampleService } from '../../../../services/example.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import angularStartProjectLibrary from 'angular-start-project-library';

@Component({
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.less'],
    imports: [CommonModule, FormsModule]
})
export class ExampleComponent implements OnInit {

    example$!: Observable<Example>;
    value!: string | null;
    localStorageService = angularStartProjectLibrary.localStorageService.default;

    constructor(private route: ActivatedRoute, private router: Router, private exampleService: ExampleService) {
    }

    ngOnInit(): void {
        this.value = this.localStorageService.storage.getItem("key");
        this.example$ = this.route.paramMap.pipe(
            switchMap(params => this.exampleService.getExample(params.get('id')!))
        );
    }

    goToExample(example: Example) {
        const heroId = example ? example.id : null;
        // Pass along the hero id if available
        // so that the HeroList component can select that hero.
        // Include a junk 'foo' property for fun.
        this.router.navigate(['/example', {id: heroId, foo: 'foo'}]);
    }
}
