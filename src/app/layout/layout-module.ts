import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Shell } from './shell/shell';
import { Sidebar } from './sidebar/sidebar';
import { Header } from './header/header';

@NgModule({
  imports: [CommonModule, RouterModule, Shell, Sidebar, Header],
  exports: [Shell],
})
export class LayoutModule {}
