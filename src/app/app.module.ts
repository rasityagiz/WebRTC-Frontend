import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { EndpointService } from './_services/endpoint.service';
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
    HttpClientModule,
    SocketIoModule.forRoot(socketConfig)
  ],
  providers: [
    EndpointService, 
    MessageService,
    // { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
