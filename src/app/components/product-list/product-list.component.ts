import { Component, OnInit, Inject } from '@angular/core';

import { ProductService } from 'services/product.service'
import { nativeServices } from 'modules/native-services.module'

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.less'],
  providers: [ProductService, nativeServices]
})
export class ProductListComponent implements OnInit {

  products = null

  constructor(private productService: ProductService, @Inject('$log') private $log: any) {
    this.$log.debug("Constructing ProductListComponent", "Blaah");
  }

  ngOnInit() {
    this.products = this.productService.getProducts();
  }
}
