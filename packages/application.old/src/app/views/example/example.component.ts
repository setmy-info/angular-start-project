import {Component, OnInit} from '@angular/core';
import {Observable, switchMap} from "rxjs";
import {Example} from "../../models/Example";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ExampleService} from "../../services/example.service";

import localStorageService from '../../../../../library/src/services/localStorageService';
// TODO : why that is not working? How can be fixed?
//import localStorageService from '../../../../node_modules/library/src/services/localStorageService';

@Component({
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.less']
})
export class ExampleComponent implements OnInit {

    example$!: Observable<Example>;
    value!: string | null;

    constructor(private route: ActivatedRoute, private router: Router, private exampleService: ExampleService) {
    }

    ngOnInit(): void {
        this.value = localStorageService.storage.getItem("key");
        this.example$ = this.route.paramMap.pipe(
            switchMap((params: ParamMap) =>
                this.exampleService.getExample(params.get('id')!))
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
