import {Routes} from '@angular/router';
import {HomeComponent} from './components/views/home/home.component';
import {AboutComponent} from './components/views/about/about.component';
import {ContactComponent} from './components/views/contact/contact.component';
import {ViewNotFoundComponent} from './components/views/view-not-found/view-not-found.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'about', component: AboutComponent},
    {path: 'contact', component: ContactComponent},
    {path: '**', component: ViewNotFoundComponent}
];
