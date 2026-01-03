import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExampleComponent } from "./components/views/example/example.component";
import { ViewNotFoundComponent } from "./components/views/view-not-found/view-not-found.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ExampleComponent, ViewNotFoundComponent],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = signal('application');
}
