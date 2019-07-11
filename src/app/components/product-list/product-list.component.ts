import { Component, OnInit } from '@angular/core';

import { ProductService } from '../../services/product.service'


@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.less'],
  providers: [ProductService]
})
export class ProductListComponent implements OnInit {

  products = null

  loggerService = (window as any).jsdi.services.$log

  constructor(private productService: ProductService) {
    this.loggerService.debug("Constructing ProductListComponent");
  }

  ngOnInit() {
    this.products = this.productService.getProducts();
  }

}
