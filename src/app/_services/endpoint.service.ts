import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable()
export class EndpointService {

    constructor(private http: HttpClient) {}

    deneme() {
        return this.http.post<any>(`${environment.apiURL}/webrtc/first`, {});
    }

}