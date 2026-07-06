import {Routes} from '@angular/router';
import {HomeComponent} from './components/views/home/home.component';
import {AboutComponent} from './components/views/about/about.component';
import {ArticlesComponent} from './components/views/articles/articles.component';
import {ContactComponent} from './components/views/contact/contact.component';
import {PrivacyComponent} from './components/views/privacy/privacy.component';
import {SettingsComponent} from './components/views/settings/settings.component';
import {TermsComponent} from './components/views/terms/terms.component';
import {ViewNotFoundComponent} from './components/views/view-not-found/view-not-found.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'about', component: AboutComponent},
    {path: 'articles', component: ArticlesComponent},
    {path: 'contact', component: ContactComponent},
    {path: 'privacy', component: PrivacyComponent},
    {path: 'settings', component: SettingsComponent},
    {path: 'terms', component: TermsComponent},
    {path: '**', component: ViewNotFoundComponent}
];
