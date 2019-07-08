import { Injectable } from '@angular/core';
import { BaseService } from './BaseService';

/**
 * window.services.productService.getProducts();
 * 
*/
@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseService {

  private products = [
    { name: "Product A", description: "Description" }
  ]

  constructor() {
    super('productService');
  }

  getProducts() {
    return this.products;
  }
}
