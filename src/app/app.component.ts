import { Component, OnInit } from '@angular/core';
import { EndpointService } from './_services/endpoint.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  x;
  
  constructor(private endpointService: EndpointService) {}

  ngOnInit() {
    this.endpointService.deneme()
      .subscribe(
        result => {
          console.log('RESULT', result);
        }
      );
  }

}
