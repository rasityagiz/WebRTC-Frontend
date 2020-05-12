import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EndpointService } from './_services/endpoint.service';
import { MessageService } from './_services/message.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  @ViewChild('localVideo', { read: ElementRef}) private localVideo: ElementRef;
  @ViewChild('remoteVideo', { read: ElementRef}) private remoteVideo: ElementRef;
  public callButtonDisabled: boolean = true;
  public hangupButtonDisabled: boolean = true;
  public startButtonDisabled: boolean = false;

  private localStream: MediaStream;
  private pc;
  private pcr;

  private offerOptions: any = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }
  
  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.messageService.listen('connect')
      .subscribe(
        (data) => {
          console.log('Connected!: ', data);
          this.messageService.emit('message', 'Connected!')
        }
      );
    
    this.messageService.listen('offer from server')
        .subscribe(
          (data) => {
            console.log('An Offer Received: ', data);
          }
        );
  }


  remoteVideoResized(event) {
    console.log('Remote video resiezed: ', event);
  }

  loadedMetadataListener(event) {
    console.log('Loaded Metadata: ', event);
  }

  /**
   * Asenkron başlatma butonu fonsksiyonu. navigator nesnesinden getUserMedia
   * ile kamera ve mikrofona erişerek akışı alıyoruz. Bunu video elementine
   * aktarıyoruz. Bu akışı localStream diye bir değişkene de aktarıyoruz.
   */
  async startButton() {
    this.messageService.emit('call started', {user: 'Caller'});
    console.log('Requesting local stream');
    this.startButtonDisabled = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
      console.log('Received local stream');
      this.localVideo.nativeElement.srcObject = stream;
      this.localStream = stream;
      this.callButtonDisabled = false;
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  async callButton () {
    this.callButtonDisabled = true;
    this.hangupButtonDisabled = false;
    console.log('Starting call');
    
    const videoTracks = this.localStream.getVideoTracks();
    const audioTracks = this.localStream.getAudioTracks();
    
    this.pc = new RTCPeerConnection({});

    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    console.log('Added local stream');

    this.pc.addEventListener('negotiationneeded', (event) => this.handleNegotiationNeededEvent());
    this.pc.addEventListener('icecandidate', (event) => this.handleICECandidateEvent(event));

  }

  private async handleNegotiationNeededEvent() {
    try {
      console.log('pc1 create offer start');
      const offer = await this.pc.createOffer(this.offerOptions);
      await this.onCreateOfferSuccess(offer);
    } catch(e) {
      this.onCreateSessionDescriptionError(e);
    }
  }

  private async onCreateOfferSuccess(desc) {
    console.log(`Offer from pc1\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    try {
      await this.pc.setLocalDescription(desc);
      this.onSetLocalSuccess();
    } catch(e) {
      this.onSetSessionDescriptionError(e);
    }
  }

  private onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  private onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  private async onSetLocalSuccess() {
    console.log(`setLocalDescription complete`);
    // await offer göndereceğiz server a
    const offer = {
      name: 'Caller',
      target: 'Callee',
      type: 'video-offer', 
      sdp: this.pc.localDescription
    }
    this.messageService.emit('offer to server', offer);
  }

  private async handleVideoAnswerMsg() {
    const sessionDescription = new RTCSessionDescription(/*Gelen SDP*/)
    this.pc.setRemoteDescription(sessionDescription);
  }

  private async handleICECandidateEvent(event) {
    // Karşıya "new-ice-candidate" mesajını server aracılığıyla göndereceğiz.
  }

  private async handleNewIceCandidateMsgAsCaller(event) {
    this.pc.addIceCandidate(event.candidate);
  }








  /**
   * Bir arama gelirse bir pop up açıp kabul red butonlarıyla 
   * durumu yöneteceğiz
   */

  public async handleVideoOfferMsg() {
    this.pcr = new RTCPeerConnection({});

    const sessionDescription = new RTCSessionDescription(/*Gelen SDP*/)
    this.pcr.setRemoteDescription(sessionDescription);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
      console.log('Received local stream');
      this.localVideo.nativeElement.srcObject = stream;
      this.localStream = stream;
      this.localStream.getTracks().forEach(track => this.pcr.addTrack(track, this.localStream));
      console.log('Added local stream');

      this.createAnswer();
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  private async createAnswer() {
    try {
      const answer = await this.pcr.createAnswer()
      this.setLocalDescFromOffer(answer);
    } catch(error) {
      console.log('Create Answer Error: ', error);
    }
    
  }

  private async setLocalDescFromOffer(answer) {
    await this.pcr.setLocalDescription(answer);
    this.sendAnswer();
  }

  private sendAnswer() {
    //Cevabı gönder. {type: video-answer, sdp: this.pcr.localDescription}
  }

  /**
   * Serverdan new-ice-candidate mesajı geldiğinde tetiklenecek
   * event.candidate
   */
  private async handleNewIceCandidateMsgAsCallee(event) {
    await this.pcr.addIceCandidate(event.candidate);
    this.pcr.addEventListener('icecandidate', (event) => this.handleICECandidateEventAsCallee(event));
  }

  private async handleICECandidateEventAsCallee(event) {
    // Karşıya "new-ice-candidate" mesajını server aracılığıyla göndereceğiz.
  }


  click() {
    console.log('Button clicked!');
    this.messageService.emit('offer to server', 'offer');
  }
}