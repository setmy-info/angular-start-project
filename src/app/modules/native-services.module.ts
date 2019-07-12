
import { environment } from "../../environments/environment"

// https://angular.io/guide/creating-libraries

export const factories = {
  $log: function () {
    return (window as any).jsdi.services.$log
  }
}

export var nativeServices = [
  { provide: '$log', useFactory: factories.$log }
]

function init() {
  console.log("Initializing");
  if (!environment.production) {
    (window as any).jsdi.services.$log.setLevel(4);
  }
}

init()