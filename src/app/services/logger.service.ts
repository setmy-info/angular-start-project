import { Injectable, SystemJsNgModuleLoaderConfig } from '@angular/core';
import { BaseService } from './BaseService';

/*
  window.services.loggerService.log('Öö');
*/
@Injectable({
  providedIn: 'root'
})
export class LoggerService extends BaseService {

  constructor() {
    super('loggerService');
    (window as any).jsdi.services.$log.setLevel(4);
  }

  public log(msg: string) {
    (window as any).jsdi.services.$log.debug(msg);
  }
}
