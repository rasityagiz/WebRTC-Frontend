import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";

@Component({
    selector: 'app-main-page',
    templateUrl: './main_page.component.html',
    styleUrls: ['./main_page.component.css']
})
export class MainPageComponent implements AfterViewInit, OnDestroy {

    @ViewChild('videoElement', { read: ElementRef }) public videoElement: ElementRef;
    private video: any;
    private videoTracks: any;
    private constraints = {
        audio: false,
        video: true
    };

    public stream: any;

    constructor() {}

    ngAfterViewInit() {
        this.video = this.videoElement.nativeElement;
        this.init();
    }

    private handleSuccess(stream): void {
        this.videoTracks = stream.getVideoTracks();
        console.log('Video Tracks: ', this.videoTracks);
        console.log('Got stream with constraints: ', this.constraints);
        console.log(`Using video device: ${this.videoTracks[0].label}`);
        this.video.srcObject = stream;
        this.video.play();
    }

    private async init(): Promise<any> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.handleSuccess(this.stream);
        } catch (e) {
            console.log('Error: ', e);
        }
    }

    ngOnDestroy() {
        this.videoTracks
            .forEach(
                element => {
                    element.stop();
                }
            );
    }

}