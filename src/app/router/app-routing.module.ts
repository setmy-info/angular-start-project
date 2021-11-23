import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ViewNotFoundComponent} from "../views/view-not-found/view-not-found.component";
import {ExampleComponent} from "../views/example/example.component";

const routes: Routes = [
    {path: 'example/:id', component: ExampleComponent},
    {path: '**', component: ViewNotFoundComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
