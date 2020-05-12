import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { Observable } from "rxjs";

@Injectable()
export class MessageService {

    constructor(private socket: Socket) {
        /* this.socket.on('connect', () => {
            console.log('Socket Connected: ', this.socket.ioSocket.connected);
            this.socket.emit('message', 'Connected!');
        }); */
    }

    listen(eventName: string): Observable<any> {
        return new Observable((subscriber) => {
            this.socket.on(eventName, (data) => {
                subscriber.next(data);
            });
        });
    }

    emit(eventName: string, data: any) {
        this.socket.emit(eventName, data);
    }

}