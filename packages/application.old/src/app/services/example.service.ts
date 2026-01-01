import {Injectable} from '@angular/core';
import {Example} from "../models/Example";
import {map, Observable, of} from "rxjs";
import {MessageService} from "./message.service";
import {EXAMPLES} from "../constants/ExampleConstants";

@Injectable({
    providedIn: 'root'
})
export class ExampleService {

    constructor(private messageService: MessageService) {
        //window['exampleService'] = <any>this;
    }

    getExample(id: number | string) {
        return this.getExamples().pipe(
            map((examples: Example[]) => examples.find(example => example.id === +id)!)
        );
    }

    getExamples(): Observable<Example[]> {
        this.messageService.add('ExampleService: fetched example');
        return of(EXAMPLES);
    }
}
