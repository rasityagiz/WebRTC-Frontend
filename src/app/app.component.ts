import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { MessageService } from './_services/message.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy{

  @ViewChild('localVideo', { read: ElementRef}) private localVideo: ElementRef;
  @ViewChild('remoteVideo', { read: ElementRef}) private remoteVideo: ElementRef;

  public user: string = '';
  public userName: string = '';
  private targetUserName: string = '';
  public onlineUsers: string[] = [];

  public enterButtonDisabled: boolean = false;
  public exitButtonDisabled: boolean = true;
  private onCall: boolean = false;
  private pcCreated: boolean = false;
  private pcrCreated: boolean = false;
  public hangupButtonDisabled: boolean = true;

  private localStream: MediaStream;
  private pc;
  private pcr;

  private callOffer: any;
  private callAnswer: any;
  private offerOptions: any = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }
  
  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.messageService.listen('connect')
      .subscribe(
        (data) => {
          console.log('Connected!');
          this.messageService.emit('message', 'Connected!');
        },
        (error) => {
          alert('Connection could not be established.');
        }
      );
    this.startLocalStream();
  }

  rowClicked(event) {
    console.log('Row Clicked: ', event);
    this.targetUserName = event;
    if(this.userName != this.targetUserName && !this.onCall) {
      if(window.confirm('Do you want to start a video call?')) {
        this.onCall = true;
        this.startCall();
      } else {
        this.targetUserName = '';
      }
    } else {
      this.targetUserName = '';
    }
  }

  onEnterButton() {
    this.enterButtonDisabled = true;
    this.exitButtonDisabled = false;
    this.userName = this.user;
    this.user = '';
    this.messageService.emit('enter', this.userName);
    this.messageService.listen('online users')
      .subscribe(
        (data) => {
          this.onlineUsers = data;
        },
        (error) => {
          alert('Online users can\'t be fetched. Check out the console.')
          console.log('Online users fecth error: ', error);
        }
      );
    this.messageService.listen('offer from server')
      .subscribe(
        (data) => {
          console.log('An Offer Received: ', data);
          if(window.confirm('A Video Call Received!')) {
            this.callOffer = data;
            this.handleVideoOfferMsg();
          } else {
            console.log('Offer Rejected.');
          }
        }
      );
  }

  onExitButton() {
    this.exitButtonDisabled = true;
    this.enterButtonDisabled = false;
    this.messageService.emit('exit', this.userName);
    this.userName = '';
    this.onlineUsers = [];
  }

  remoteVideoResized(event) {
    console.log('Remote video resiezed: ', event);
  }

  loadedMetadataListener(event) {
    console.log('Loaded Metadata: ', event);
  }

  async startLocalStream() {
    console.log('Requesting local stream');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
      console.log('Received local stream');
      this.localVideo.nativeElement.srcObject = stream;
      this.localStream = stream;
    } catch (e) {
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  async startCall () {
    this.exitButtonDisabled = true;
    this.messageService.listen('answer from server')
      .subscribe(
        (data) => {
          console.log('An Answer Received', data);
          this.callAnswer = data;
          this.handleVideoAnswerMsg();
        }
      );
    this.hangupButtonDisabled = false;
    console.log('Starting call');
    
    const videoTracks = this.localStream.getVideoTracks();
    const audioTracks = this.localStream.getAudioTracks();
    
    this.pc = new RTCPeerConnection({});
    this.pcCreated = true;

    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    console.log('Added local stream');

    this.pc.addEventListener('negotiationneeded', (event) => this.handleNegotiationNeededEvent());
    this.pc.addEventListener('icecandidate', (event) => this.handleICECandidateEventAsCaller(event));
    this.pc.addEventListener('track', (event) => this.gotRemoteStream(event));

  }

  private async handleNegotiationNeededEvent() {
    try {
      console.log('pc create offer start');
      const offer = await this.pc.createOffer(this.offerOptions);
      await this.onCreateOfferSuccess(offer);
    } catch(e) {
      this.onCreateSessionDescriptionError(e);
    }
  }

  private async onCreateOfferSuccess(desc) {
    console.log(`Offer from pc\n${desc.sdp}`);
    console.log('pc setLocalDescription start');
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
    console.log('setLocalDescription complete');
    console.log('Offer sending...');
    const offer = {
      name: this.userName,
      target: this.targetUserName,
      type: 'video-offer', 
      sdp: this.pc.localDescription
    }
    this.messageService.emit('offer to server', offer);
  }

  private async handleVideoAnswerMsg() {
    const sessionDescription = new RTCSessionDescription(this.callAnswer.sdp)
    this.pc.setRemoteDescription(sessionDescription);
  }

  private async handleICECandidateEventAsCaller(event) {
    this.messageService.listen('new ice candidate from server')
      .subscribe(
        (data) => {
          const event = data;
          this.handleNewIceCandidateMsgAsCaller(event);
        }
      );
    const newIceCandidate = {
      type: 'new-ice-candidate',
      target: this.targetUserName,
      candidate: event.candidate
    }
    this.messageService.emit('new ice candidate to server', newIceCandidate);
  }

  private async handleNewIceCandidateMsgAsCaller(event) {
    if(event.candidate != null) {
      this.pc.addIceCandidate(event.candidate);
    }
  }



  /**
   * Bir arama gelirse bir pop up açıp kabul red butonlarıyla 
   * durumu yöneteceğiz
   */

  public async handleVideoOfferMsg() {
    this.hangupButtonDisabled = false;
    this.exitButtonDisabled = true;
    this.pcr = new RTCPeerConnection({});
    this.pcrCreated = true;

    this.pcr.addEventListener('icecandidate', (event) => this.handleICECandidateEventAsCallee(event));
    this.pcr.addEventListener('track', (event) => this.gotRemoteStream(event));

    try {
      const sessionDescription = new RTCSessionDescription(this.callOffer.sdp);
      await this.pcr.setRemoteDescription(sessionDescription);
    } catch(error) {
      alert('Set remote desc error.');
    }

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
    const answer = {
      name: this.userName,
      target: this.callOffer.name,
      type: 'video-answer', 
      sdp: this.pcr.localDescription
    }
    this.messageService.emit('answer to server', answer);
  }

  /**
   * Serverdan new-ice-candidate mesajı geldiğinde tetiklenecek
   * event.candidate
   */
  private handleNewIceCandidateMsgAsCallee(event) {
    if(event.candidate != null) {
      this.pcr.addIceCandidate(event.candidate);
    }
  }

  private async handleICECandidateEventAsCallee(event) {
    this.messageService.listen('new ice candidate from server')
      .subscribe(
        (data) => {
          const event = data;
          this.handleNewIceCandidateMsgAsCallee(event);
        }
      );
    const newIceCandidate = {
      type: 'new-ice-candidate',
      target: this.callOffer.name,
      candidate: event.candidate
    }
    this.messageService.emit('new ice candidate to server', newIceCandidate);
  }


  private gotRemoteStream(e) {
    if(this.remoteVideo.nativeElement.srcObject !== e.streams[0]) {
      this.remoteVideo.nativeElement.srcObject = e.streams[0];
      console.log('Received remote stream');
    }
  }

  onHangupButton() {
    if(this.pcCreated) {
      this.pc.close();
      this.pc.onnegotiationneeded = null;
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pcrCreated = false;
    }
    if(this.pcrCreated) {
      this.pcr.close();
      this.pcr.onicecandidate = null;
      this.pcr.ontrack = null;
      this.pcrCreated = false;
    }
    this.hangupButtonDisabled = true;
    this.exitButtonDisabled = false;
    this.onCall = false;
  }

  @HostListener('window:beforeunload')
  ngOnDestroy() {
    this.onHangupButton();
    this.onExitButton();
  }
}