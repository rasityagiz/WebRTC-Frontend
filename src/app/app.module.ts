import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppHttpInterceptor } from './_interceptors/app-http.interceptor';
import { SocketIoModule, SocketIoConfig} from 'ngx-socket-io';
import { MessageService } from './_services/message.service';

const socketConfig: SocketIoConfig = { url: 'ws://localhost:5000', options: {}};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    SocketIoModule.forRoot(socketConfig)
  ],
  providers: [ 
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
