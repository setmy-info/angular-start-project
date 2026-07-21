import {Routes} from '@angular/router';
import {HomeComponent} from './components/views/home/home.component';
import {AboutComponent} from './components/views/about/about.component';
import {ArticlesComponent} from './components/views/articles/articles.component';
import {ArticleDetailComponent} from './components/views/article-detail/article-detail.component';
import {ContactComponent} from './components/views/contact/contact.component';
import {PrivacyComponent} from './components/views/privacy/privacy.component';
import {SettingsComponent} from './components/views/settings/settings.component';
import {TermsComponent} from './components/views/terms/terms.component';
import {ProductsServicesComponent} from './components/views/products-services/products-services.component';
import {NewsComponent} from './components/views/news/news.component';
import {HelpComponent} from './components/views/help/help.component';
import {ToolsComponent} from './components/views/tools/tools.component';
import {CommercialsComponent} from './components/views/commercials/commercials.component';
import {AdsComponent} from './components/views/ads/ads.component';
import {SponsorsComponent} from './components/views/sponsors/sponsors.component';
import {TemplatePageComponent} from './components/views/template-page/template-page.component';
import {ViewNotFoundComponent} from './components/views/view-not-found/view-not-found.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'about', component: AboutComponent},
    {path: 'articles', component: ArticlesComponent},
    {path: 'articles/:id', component: ArticleDetailComponent},
    {path: 'contact', component: ContactComponent},
    {path: 'privacy', component: PrivacyComponent},
    {path: 'settings', component: SettingsComponent},
    {path: 'terms', component: TermsComponent},
    // The old app's full page set (URL-only, not in any menu — same as the old app, where these
    // were commented out of the menu sets; path names match the old routes 1:1):
    {path: 'productsServices', component: ProductsServicesComponent},
    {path: 'news', component: NewsComponent},
    {path: 'help', component: HelpComponent},
    {path: 'tools', component: ToolsComponent},
    {path: 'commercials', component: CommercialsComponent},
    {path: 'ads', component: AdsComponent},
    {path: 'sponsors', component: SponsorsComponent},
    {path: 'template', component: TemplatePageComponent},
    {path: '**', component: ViewNotFoundComponent}
];
