import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule,MatCardModule} from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FontAwesomeComponent}  from './font-awesome/font-awesome.component';
import { MaterialIconComponent}  from './material-icons/icons.component';

import { IconsRoutes } from './icons.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    RouterModule.forChild(IconsRoutes),
    FlexLayoutModule
    
  ],
  declarations: [ 
    FontAwesomeComponent,
    MaterialIconComponent
  ]
})

export class IconsModule {}
