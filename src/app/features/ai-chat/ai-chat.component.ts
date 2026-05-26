import { User } from './../../core/models/user.model';
import {
  Component, inject, signal, ViewChild, ElementRef,
  AfterViewChecked, NgZone, OnDestroy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AiChatService } from '../../core/services/ai-chat.service';

type Mode = 'text' | 'image' | 'video' | 'speech';

interface ChatMessage {
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="chat-wrapper">

      <!-- Header -->
      <div class="chat-header">
        <div class="header-brand">
          <div class="ai-avatar-header"><mat-icon>smart_toy</mat-icon></div>
          <div>
            <span class="brand-name">Assistente IA</span>
            <span class="status-dot">● Online</span>
          </div>
        </div>

        <div class="mode-tabs">
          <button class="mode-tab" [class.active]="mode() === 'text'" (click)="setMode('text')">
            <mat-icon>chat_bubble_outline</mat-icon><span>Texto</span>
          </button>
          <button class="mode-tab" [class.active]="mode() === 'image'" (click)="setMode('image')">
            <mat-icon>image</mat-icon><span>Imagem</span>
          </button>
          <button class="mode-tab" [class.active]="mode() === 'video'" (click)="setMode('video')">
            <mat-icon>videocam</mat-icon><span>Vídeo</span>
          </button>
          <button class="mode-tab" [class.active]="mode() === 'speech'" (click)="setMode('speech')">
            <mat-icon>mic</mat-icon><span>Fala</span>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #messagesArea>
        @if (messages().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">{{ emptyIcon() }}</mat-icon>
            <p class="empty-title">{{ emptyTitle() }}</p>
            <p class="empty-hint">{{ emptyHint() }}</p>
          </div>
        }

        @for (msg of messages(); track $index) {
          <div class="msg-row" [class.user-row]="msg.role === 'user'" [class.ai-row]="msg.role === 'assistant'">
            @if (msg.role === 'assistant') {
              <div class="bubble-avatar ai"><mat-icon>smart_toy</mat-icon></div>
            }
            <div class="bubble" [class.user-bubble]="msg.role === 'user'" [class.ai-bubble]="msg.role === 'assistant'">
              @if (msg.type === 'text') {
                <p class="msg-text">{{ msg.content }}</p>
              } @else if (msg.type === 'image') {
                <img [src]="msg.content" alt="Imagem gerada" class="msg-img" />
                <p class="img-caption">Imagem gerada pela IA</p>
              } @else if (msg.type === 'video') {
                <video [src]="msg.content" controls class="msg-video" preload="metadata"></video>
                <p class="img-caption">Vídeo gerado pela IA</p>
              } @else if (msg.type === 'audio') {
                <div class="audio-bubble">
                  <button mat-icon-button (click)="playAudio(msg.content)" matTooltip="Reproduzir">
                    <mat-icon>play_circle_filled</mat-icon>
                  </button>
                  <div class="audio-bars">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <span class="audio-label">{{ msg.role === 'user' ? 'Áudio enviado' : 'Resposta em voz' }}</span>
                </div>
              }
              <span class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</span>
            </div>
            @if (msg.role === 'user') {
              <div class="bubble-avatar user"><mat-icon>person</mat-icon></div>
            }
          </div>
        }

        @if (loading()) {
          <div class="msg-row ai-row">
            <div class="bubble-avatar ai"><mat-icon>smart_toy</mat-icon></div>
            <div class="bubble ai-bubble typing-bubble">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        }
      </div>

      <!-- Input -->
      <div class="input-area">
        @if (mode() === 'text') {
          <div class="text-row">
            <textarea
              [(ngModel)]="inputText"
              placeholder="Digite sua mensagem..."
              (keydown.enter)="onEnter($event)"
              class="chat-input"
              rows="1"
            ></textarea>
            <button mat-icon-button class="send-btn" (click)="sendText()" [disabled]="!inputText.trim() || loading()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        } @else if (mode() === 'image') {
          <div class="image-input-area">
            @if (referenceImages().length > 0) {
              <div class="ref-images-row">
                @for (img of referenceImages(); track $index) {
                  <div class="ref-thumb-wrap">
                    <img [src]="'data:image/jpeg;base64,' + img" class="ref-thumb" />
                    <button class="ref-remove" (click)="removeRefImage($index)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }
            <div class="text-row">
              <textarea
                [(ngModel)]="inputText"
                placeholder="Descreva a imagem que deseja gerar..."
                (keydown.enter)="onEnter($event)"
                class="chat-input"
                rows="1"
              ></textarea>
              <select [(ngModel)]="imageSize" class="size-select">
                <option value="256x256">256×256</option>
                <option value="1024x1024">1024×1024</option>
                <option value="1792x1024">1792×1024</option>
                <option value="1024x1792">1024×1792</option>
              </select>
              <input #fileInput type="file" accept="image/*" multiple hidden (change)="onRefImagesSelected($event)" />
              <button mat-icon-button class="attach-btn" (click)="fileInput.click()" matTooltip="Adicionar imagens de referência">
                <mat-icon>attach_file</mat-icon>
              </button>
              <button mat-icon-button class="send-btn img-btn" (click)="sendImage()" [disabled]="!inputText.trim() || loading()">
                <mat-icon>image_search</mat-icon>
              </button>
            </div>
          </div>
        } @else if (mode() === 'video') {
          <div class="video-input-area">
            @if (videoRefUrls().length > 0) {
              <div class="ref-urls-list">
                @for (url of videoRefUrls(); track $index) {
                  <div class="ref-url-chip">
                    <mat-icon class="chip-icon">link</mat-icon>
                    <span class="chip-text" [title]="url">{{ url }}</span>
                    <button class="chip-remove" (click)="removeVideoRefUrl($index)"><mat-icon>close</mat-icon></button>
                  </div>
                }
              </div>
            }
            <div class="text-row">
              <textarea
                [(ngModel)]="inputText"
                placeholder="Descreva o vídeo que deseja gerar..."
                (keydown.enter)="onEnter($event)"
                class="chat-input"
                rows="1"
              ></textarea>
              <button mat-icon-button class="send-btn video-btn" (click)="sendVideo()" [disabled]="!inputText.trim() || loading()">
                <mat-icon>videocam</mat-icon>
              </button>
            </div>
            <div class="video-options-row">
              <div class="video-opt-group">
                <label>Duração</label>
                <select [(ngModel)]="videoDuration" class="size-select">
                  <option [ngValue]="5">5s</option>
                  <option [ngValue]="10">10s</option>
                  <option [ngValue]="15">15s</option>
                  <option [ngValue]="20">20s</option>
                </select>
              </div>
              <div class="video-opt-group">
                <label>Proporção</label>
                <select [(ngModel)]="videoAspectRatio" class="size-select">
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                  <option value="9:16">9:16</option>
                </select>
              </div>
              <div class="video-opt-group">
                <label>Resolução</label>
                <select [(ngModel)]="videoResolution" class="size-select">
                  <option value="480p">480p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
              <div class="video-opt-group url-group">
                <input
                  [(ngModel)]="videoRefInput"
                  placeholder="URL de imagem de referência..."
                  class="url-input"
                  (keydown.enter)="addVideoRefUrl(); $event.preventDefault()"
                />
                <button mat-icon-button class="attach-btn" (click)="addVideoRefUrl()" matTooltip="Adicionar URL" [disabled]="!videoRefInput.trim()">
                  <mat-icon>add_link</mat-icon>
                </button>
              </div>
            </div>
          </div>
        } @else {
          <div class="audio-row">
            <div class="record-status">
              @if (recording()) {
                <span class="rec-label"><span class="rec-dot"></span> Gravando {{ recTime() }}s — solte para enviar</span>
              } @else if (loading()) {
                <span class="proc-label"><mat-icon style="font-size:14px;vertical-align:middle">hourglass_top</mat-icon> Processando...</span>
              } @else {
                <span class="idle-label">Segure o botão e fale</span>
              }
            </div>
            <button
              class="record-btn"
              [class.recording]="recording()"
              (mousedown)="startRecording()"
              (mouseup)="stopRecording()"
              (touchstart)="startRecording()"
              (touchend)="stopRecording()"
              [disabled]="loading()"
              matTooltip="Segurar para gravar"
            >
              <mat-icon>{{ recording() ? 'stop' : 'mic' }}</mat-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .chat-wrapper {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 92px);
      background: var(--bg);
      border-radius: 16px;
      border: 1px solid var(--border);
      overflow: hidden;
    }

    /* ── Header ── */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .header-brand { display: flex; align-items: center; gap: 12px; }

    .ai-avatar-header {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #3d5afe, #70c73c);
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #fff; font-size: 20px; }
    }

    .brand-name { display: block; font-size: 15px; font-weight: 700; color: var(--text); }
    .status-dot { display: block; font-size: 11px; color: #70c73c; margin-top: 2px; }

    /* Mode tabs */
    .mode-tabs { display: flex; gap: 6px; }

    .mode-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 20px; border: 1px solid var(--border);
      background: transparent; color: var(--text-sec); cursor: pointer;
      font-size: 13px; font-weight: 500; transition: all 0.2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .mode-tab:hover { background: rgba(112,199,60,0.08); color: var(--text); }

    .mode-tab.active {
      background: linear-gradient(135deg, rgba(61,90,254,0.15), rgba(112,199,60,0.15));
      border-color: #3d5afe;
      color: var(--text);
    }

    /* ── Messages ── */
    .messages-area {
      flex: 1; overflow-y: auto; padding: 20px 16px;
      display: flex; flex-direction: column; gap: 12px;
    }

    .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
      color: var(--text-sec); text-align: center; padding: 40px;
    }

    .empty-icon { font-size: 52px; width: 52px; height: 52px; opacity: 0.4; }
    .empty-title { font-size: 17px; font-weight: 600; color: var(--text); margin: 0; }
    .empty-hint { font-size: 13px; margin: 0; }

    /* Row */
    .msg-row { display: flex; align-items: flex-end; gap: 8px; }
    .user-row { flex-direction: row-reverse; }

    .bubble-avatar {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px; color: #fff; }
    }
    .bubble-avatar.ai { background: linear-gradient(135deg, #3d5afe, #70c73c); }
    .bubble-avatar.user { background: #3d5afe; }

    /* Bubble */
    .bubble {
      max-width: 68%; border-radius: 16px; padding: 10px 14px;
      position: relative;
    }

    .ai-bubble {
      background: var(--surface);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
    }

    .user-bubble {
      background: linear-gradient(135deg, #3d5afe, #5c6bc0);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .msg-text { margin: 0 0 4px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .user-bubble .msg-text { color: #fff; }
    .ai-bubble .msg-text { color: var(--text); }

    .msg-time {
      display: block; font-size: 10px; text-align: right; margin-top: 4px;
      color: rgba(255,255,255,0.55);
    }
    .ai-bubble .msg-time { color: var(--text-sec); }

    /* Image */
    .msg-img {
      max-width: 100%; border-radius: 10px; display: block;
      border: 1px solid var(--border);
    }
    .img-caption { font-size: 11px; color: var(--text-sec); margin: 6px 0 2px; }

    /* Audio bubble */
    .audio-bubble { display: flex; align-items: center; gap: 8px; }
    .audio-bars {
      display: flex; align-items: center; gap: 2px; height: 20px;
      span {
        display: block; width: 3px; border-radius: 2px; background: currentColor; opacity: 0.6;
        animation: bar 0.8s ease-in-out infinite alternate;
      }
      span:nth-child(1) { height: 6px; animation-delay: 0s; }
      span:nth-child(2) { height: 12px; animation-delay: 0.1s; }
      span:nth-child(3) { height: 18px; animation-delay: 0.2s; }
      span:nth-child(4) { height: 12px; animation-delay: 0.3s; }
      span:nth-child(5) { height: 6px; animation-delay: 0.4s; }
    }
    .audio-label { font-size: 12px; white-space: nowrap; }

    @keyframes bar {
      from { transform: scaleY(0.5); }
      to { transform: scaleY(1); }
    }

    /* Typing */
    .typing-bubble {
      display: flex; align-items: center; gap: 5px;
      padding: 14px 18px;
    }
    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--text-sec);
      animation: bounce 1.2s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-8px); opacity: 1; }
    }

    /* ── Input Area ── */
    .input-area {
      padding: 14px 16px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }

    .text-row {
      display: flex; align-items: flex-end; gap: 8px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 8px 8px 8px 14px;
      transition: border-color 0.2s;
      &:focus-within { border-color: #3d5afe; }
    }

    .chat-input {
      flex: 1; resize: none; background: transparent; border: none; outline: none;
      font-size: 14px; color: var(--text); line-height: 1.5;
      max-height: 120px; overflow-y: auto;
      &::placeholder { color: var(--text-sec); }
    }

    .size-select {
      background: transparent; border: 1px solid var(--border); border-radius: 8px;
      padding: 4px 8px; font-size: 12px; color: var(--text-sec); cursor: pointer;
      outline: none; flex-shrink: 0;
    }

    .send-btn {
      color: #3d5afe !important; flex-shrink: 0;
      &:disabled { color: var(--text-sec) !important; }
    }
    .img-btn { color: #70c73c !important; }
    .attach-btn { color: var(--text-sec) !important; flex-shrink: 0; }

    .image-input-area { display: flex; flex-direction: column; gap: 8px; }

    .ref-images-row {
      display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 2px;
    }

    .ref-thumb-wrap {
      position: relative; width: 56px; height: 56px; flex-shrink: 0;
    }

    .ref-thumb {
      width: 56px; height: 56px; object-fit: cover; border-radius: 8px;
      border: 1px solid var(--border);
    }

    .ref-remove {
      position: absolute; top: -6px; right: -6px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #ef5350; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; padding: 0;
      mat-icon { font-size: 12px; width: 12px; height: 12px; color: #fff; }
    }

    /* Video */
    .msg-video {
      max-width: 100%; border-radius: 10px; display: block;
      border: 1px solid var(--border); background: #000;
    }

    .video-input-area { display: flex; flex-direction: column; gap: 8px; }

    .video-options-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 0 2px;
    }

    .video-opt-group {
      display: flex; align-items: center; gap: 6px;
      label { font-size: 11px; color: var(--text-sec); white-space: nowrap; }
    }

    .url-group { flex: 1; min-width: 180px; }

    .url-input {
      flex: 1; background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; padding: 5px 10px; font-size: 12px;
      color: var(--text); outline: none; width: 100%;
      &::placeholder { color: var(--text-sec); }
      &:focus { border-color: #3d5afe; }
    }

    .video-btn { color: #9c27b0 !important; }

    .ref-urls-list {
      display: flex; flex-direction: column; gap: 4px; padding: 2px;
    }

    .ref-url-chip {
      display: flex; align-items: center; gap: 6px;
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; padding: 4px 8px; max-width: 100%;
    }

    .chip-icon { font-size: 14px; width: 14px; height: 14px; color: #9c27b0; flex-shrink: 0; }

    .chip-text {
      flex: 1; font-size: 11px; color: var(--text-sec);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .chip-remove {
      background: none; border: none; cursor: pointer; padding: 0;
      display: flex; align-items: center;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--text-sec); }
      &:hover mat-icon { color: #ef5350; }
    }

    /* Audio row */
    .audio-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 4px 4px 12px;
    }

    .record-status { font-size: 13px; }
    .rec-label { color: #ef5350; display: flex; align-items: center; gap: 6px; }
    .rec-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: #ef5350;
      animation: pulse-dot 1s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
    }
    .proc-label { color: var(--text-sec); }
    .idle-label { color: var(--text-sec); }

    .record-btn {
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
      background: linear-gradient(135deg, #3d5afe, #70c73c);
      color: #fff; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(61,90,254,0.35);
      transition: transform 0.15s, box-shadow 0.15s;
      mat-icon { font-size: 26px; }
      &:hover:not(:disabled) { transform: scale(1.05); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .record-btn.recording {
      background: linear-gradient(135deg, #ef5350, #c62828);
      box-shadow: 0 4px 20px rgba(239,83,80,0.5);
      animation: pulse-ring 1.2s ease-out infinite;
    }

    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(239,83,80,0.6); }
      70% { box-shadow: 0 0 0 14px rgba(239,83,80,0); }
      100% { box-shadow: 0 0 0 0 rgba(239,83,80,0); }
    }

    /* Scrollbar */
    .messages-area::-webkit-scrollbar { width: 4px; }
    .messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    @media (max-width: 600px) {
      .mode-tab span { display: none; }
      .bubble { max-width: 85%; }
    }
  `]
})
export class AiChatComponent implements AfterViewChecked, OnDestroy {
  private svc = inject(AiChatService);
  private ngZone = inject(NgZone);

  @ViewChild('messagesArea') private msgArea!: ElementRef<HTMLDivElement>;

  mode = signal<Mode>('text');
  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  recording = signal(false);
  recTime = signal(0);
  referenceImages = signal<string[]>([]);
  videoRefUrls = signal<string[]>([]);
  inputText = '';
  videoRefInput = '';
  imageSize = '256x256';
  videoDuration = 10;
  videoAspectRatio = '4:3';
  videoResolution = '720p';

  private prevMsgLen = 0;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private recInterval?: ReturnType<typeof setInterval>;

  ngAfterViewChecked() {
    if (this.messages().length !== this.prevMsgLen || this.loading()) {
      this.prevMsgLen = this.messages().length;
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    this.clearRecInterval();
  }

  setMode(m: Mode) {
    this.mode.set(m);
    this.messages.set([]);
    this.referenceImages.set([]);
    this.videoRefUrls.set([]);
  }

  emptyIcon(): string {
    return { text: 'chat_bubble_outline', image: 'image_search', video: 'videocam', speech: 'record_voice_over' }[this.mode()];
  }

  emptyTitle(): string {
    return { text: 'Converse com a IA', image: 'Gere imagens com IA', video: 'Gere vídeos com IA', speech: 'Fale com a IA' }[this.mode()];
  }

  emptyHint(): string {
    return {
      text: 'Digite uma mensagem e pressione Enter ou clique em Enviar.',
      image: 'Descreva o que você quer ver e clique em Gerar.',
      video: 'Descreva a cena, ajuste as opções e clique em Gerar.',
      speech: 'Segure o botão de microfone, fale e solte para enviar.'
    }[this.mode()];
  }

  onEnter(e: Event) {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      if (this.mode() === 'text') this.sendText();
      else if (this.mode() === 'image') this.sendImage();
      else if (this.mode() === 'video') this.sendVideo();
    }
  }

  sendText() {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    const history = this.messages();
    const userMsgs = history.filter(m => m.role === 'user' && m.type === 'text').map(m => ({ content: m.content }));
    const aiMsgs   = history.filter(m => m.role === 'assistant' && m.type === 'text').map(m => ({ content: m.content }));

    this.pushMessage('user', 'text', text);
    this.inputText = '';
    this.loading.set(true);

    this.svc.sendText({
      user: 'Usuário',
      newMessage: text,
      previousMessagesUsers: userMsgs,
      previousMessagesAssistents: aiMsgs,
    }).subscribe({
      next: res => {
        this.loading.set(false);
        this.pushMessage('assistant', 'text', res.message ?? 'Sem resposta.');
      },
      error: () => {
        this.loading.set(false);
        this.pushMessage('assistant', 'text', 'Ocorreu um erro ao obter resposta.');
      }
    });
  }

  sendImage() {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    this.pushMessage('user', 'text', text);
    this.inputText = '';
    this.loading.set(true);

    this.svc.generateImage({
      Message: text,
      Size: this.imageSize,
      Quality: 'high',
      NumberImages: 1,
      ReferenceImages: this.referenceImages()
    }).subscribe({
      next: res => {
        this.loading.set(false);
        const url = res.imageUrl?.[0] ?? '';
        if (url) {
          this.pushMessage('assistant', 'image', url);
        } else {
          this.pushMessage('assistant', 'text', 'Nenhuma imagem retornada.');
        }
        this.referenceImages.set([]);
      },
      error: () => {
        this.loading.set(false);
        this.pushMessage('assistant', 'text', 'Erro ao gerar imagem.');
      }
    });
  }

  sendVideo() {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    this.pushMessage('user', 'text', text);
    this.inputText = '';
    this.loading.set(true);

    this.svc.generateVideo({
      Message: text,
      Duration: this.videoDuration,
      AspectRatio: this.videoAspectRatio,
      Resolution: this.videoResolution,
      ReferenceImages: this.videoRefUrls()
    }).subscribe({
      next: url => {
        this.loading.set(false);
        const videoUrl = (url ?? '').trim();
        if (videoUrl) {
          this.pushMessage('assistant', 'video', videoUrl);
        } else {
          this.pushMessage('assistant', 'text', 'Nenhum vídeo retornado.');
        }
        this.videoRefUrls.set([]);
      },
      error: () => {
        this.loading.set(false);
        this.pushMessage('assistant', 'text', 'Erro ao gerar vídeo.');
      }
    });
  }

  addVideoRefUrl() {
    const url = this.videoRefInput.trim();
    if (!url) return;
    this.videoRefUrls.update(urls => [...urls, url]);
    this.videoRefInput = '';
  }

  removeVideoRefUrl(index: number) {
    this.videoRefUrls.update(urls => urls.filter((_, i) => i !== index));
  }

  async onRefImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    const base64List = await Promise.all(files.map(f => this.fileToBase64(f)));
    this.referenceImages.update(imgs => [...imgs, ...base64List]);
    input.value = '';
  }

  removeRefImage(index: number) {
    this.referenceImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });
  }

  async startRecording() {
    if (this.recording() || this.loading()) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) this.audioChunks.push(e.data); };
      this.mediaRecorder.start();
      this.recording.set(true);
      this.recTime.set(0);
      this.recInterval = setInterval(() => this.ngZone.run(() => this.recTime.update(t => t + 1)), 1000);
    } catch {
      alert('Permissão de microfone negada.');
    }
  }

  stopRecording() {
    if (!this.recording() || !this.mediaRecorder) return;
    this.clearRecInterval();
    this.mediaRecorder.stop();
    this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
    this.recording.set(false);

    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const base64 = await this.blobToBase64(blob);
      this.ngZone.run(() => {
        this.pushMessage('user', 'audio', base64);
        this.loading.set(true);
        this.svc.speechToSpeech(base64).subscribe({
          next: res => {
            this.loading.set(false);
            this.pushMessage('assistant', 'audio', res.result ?? '');
          },
          error: () => {
            this.loading.set(false);
            this.pushMessage('assistant', 'text', 'Erro ao processar áudio.');
          }
        });
      });
    };
  }

  playAudio(base64: string) {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play().catch(() => {
      const audio2 = new Audio(`data:audio/wav;base64,${base64}`);
      audio2.play();
    });
  }

  private pushMessage(role: 'user' | 'assistant', type: ChatMessage['type'], content: string) {
    this.messages.update(msgs => [...msgs, { role, type, content, timestamp: new Date() }]);
  }

  private scrollToBottom() {
    try {
      const el = this.msgArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  }

  private clearRecInterval() {
    if (this.recInterval) { clearInterval(this.recInterval); this.recInterval = undefined; }
  }
}
