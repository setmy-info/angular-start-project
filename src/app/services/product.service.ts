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

  private i = 0;

  private products = [
    { name: "Product A", description: "Description" }
  ]

  constructor() {
    super('productService');
    console.log("productService.constructor");
  }

  getProducts() {
    return this.products;
  }

  increase(): number {
    this.i++;
    return this.i;
  }
}
