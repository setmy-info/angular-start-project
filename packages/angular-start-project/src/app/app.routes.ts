import { Routes } from '@angular/router';
import { HomeComponent } from './components/views/home/home.component';
import { AboutComponent } from './components/views/about/about.component';
import { ContactComponent } from './components/views/contact/contact.component';
import { PrivacyComponent } from './components/views/privacy/privacy.component';
import { SettingsComponent } from './components/views/settings/settings.component';
import { TermsComponent } from './components/views/terms/terms.component';
import { ProductsServicesComponent } from './components/views/products-services/products-services.component';
import { NewsComponent } from './components/views/news/news.component';
import { HelpComponent } from './components/views/help/help.component';
import { ToolsComponent } from './components/views/tools/tools.component';
import { CommercialsComponent } from './components/views/commercials/commercials.component';
import { AdsComponent } from './components/views/ads/ads.component';
import { SponsorsComponent } from './components/views/sponsors/sponsors.component';
import { TemplatePageComponent } from './components/views/template-page/template-page.component';
import { ViewNotFoundComponent } from './components/views/view-not-found/view-not-found.component';
import { AuthCallbackComponent } from './components/views/auth-callback/auth-callback.component';
import { ProfileComponent } from './components/views/profile/profile.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'privacy', component: PrivacyComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'terms', component: TermsComponent },
    // The old app's full page set (URL-only, not in any menu — same as the old app, where these
    // were commented out of the menu sets; path names match the old routes 1:1):
    { path: 'productsServices', component: ProductsServicesComponent },
    { path: 'news', component: NewsComponent },
    { path: 'help', component: HelpComponent },
    { path: 'tools', component: ToolsComponent },
    { path: 'commercials', component: CommercialsComponent },
    { path: 'ads', component: AdsComponent },
    { path: 'sponsors', component: SponsorsComponent },
    { path: 'template', component: TemplatePageComponent },
    // Keycloak OIDC redirect target. Its path must match environment.keycloak.redirectUri, and
    // it must NOT be guarded — this route is how a session is created in the first place.
    { path: 'auth/callback', component: AuthCallbackComponent },
    // EXAMPLE of a protected route. authGuard renews an expired access token silently, and sends
    // the browser to Keycloak when there is no usable session; with the feature flag off it lets
    // everything through. Lazy-loaded feature routes take the same guard:
    //     { path: 'admin', canActivate: [authGuard],
    //       loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes) }
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: '**', component: ViewNotFoundComponent },
];
