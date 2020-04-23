import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
    private req: HttpRequest<any>;

    intercept(request: HttpRequest<any>, next: HttpHandler):Observable<HttpEvent<any>> {
        if(!request.headers.has('Content-Type')) {
            console.log('Interceptor1');
            request = request.clone({ 
                headers: request.headers.set('Content-Type', 'application/json')
            });
        }

        request = request.clone({
            headers: request.headers.set('Accept', 'application/json')
        });
        console.log('Interceptor2');
        this.req = request;

        return next.handle(request).pipe(
            map((event: HttpEvent<any>) => {
                console.log('Interceptor3');
                return event;
            })
        );
    }
}