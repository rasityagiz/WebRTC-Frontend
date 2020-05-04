import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EndpointService } from './_services/endpoint.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit{

  @ViewChild('videoElement', { read: ElementRef}) public videoElement: ElementRef; 
  private video: any;
  private constraints = {
    audio: false,
    video: true
  };
  
  public stream: any;
  
  constructor(private endpointService: EndpointService) {}

  ngOnInit() {
    /* this.endpointService.deneme()
      .subscribe(
        result => {
          console.log('RESULT', result);
        }
      ); */
  }

  ngAfterViewInit() {
    this.video = this.videoElement.nativeElement;
    this.init();
  }

  private handleSuccess(stream): void {
    const videoTrakcs = stream.getVideoTracks();
    console.log('Got stream with constraints: ', this.constraints);
    console.log(`Using video device: ${videoTrakcs[0].label}`);
    this.video.srcObject = stream;
    this.video.play();
  }

  private async init(): Promise<any> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      this.handleSuccess(this.stream);
    } catch(e) {
      console.log('Error: ', e);
    }
  }

}
