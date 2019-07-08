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

  constructor(private productService: ProductService) { }

  ngOnInit() {
    this.products = this.productService.getProducts();
  }

}
