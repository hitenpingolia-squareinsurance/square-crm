import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProductMasterComponent } from './product-master/product-master.component';


const routes: Routes = [
  {path: 'lob' , component:ProductMasterComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductMappingRoutingModule { }
