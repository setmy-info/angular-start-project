import { Routes } from '@angular/router';
import { ExampleComponent } from "./components/views/example/example.component";
import { ViewNotFoundComponent } from "./components/views/view-not-found/view-not-found.component";

export const routes: Routes = [
    {path: 'example/:id', component: ExampleComponent},
    {path: '**', component: ViewNotFoundComponent}
];
