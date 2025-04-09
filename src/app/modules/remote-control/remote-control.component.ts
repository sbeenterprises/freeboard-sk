import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { AppFacade } from 'src/app/app.facade';

@Component({
  selector: 'remote-control',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSliderModule,
    CdkDrag,
    CdkDragHandle
  ],
  template: `
    <div class="remote-control-container">
      <mat-card cdkDrag>
        <div class="title" cdkDragHandle>
          <div style="flex: 1 1 auto; font-size: 14pt; line-height: 2.5em; text-align: center; cursor: grab;">
            Remote Control
          </div>
          <div>
            <button mat-icon-button (click)="closePanel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        
        <mat-card-content>
          <div class="control-section">
            <label>Rudder: {{rudder}}°</label>
            <div class="horizontal-slider-container">
              <span class="limit-label">-30°</span>
              <input class="slider horizontal" type="range" min="-30" max="30" [(ngModel)]="rudder" (change)="sendRudderCommand(rudder)">
              <span class="limit-label">30°</span>
            </div>
          </div>
          
          <div class="control-section">
            <label>Thrust: {{thrust}}%</label>
            <div class="vertical-slider-container">
              <span class="limit-label">100%</span>
              <input class="slider vertical" type="range" min="0" max="100" [(ngModel)]="thrust" (change)="sendThrustCommand(thrust)" orient="vertical">
              <span class="limit-label">0%</span>
            </div>
          </div>
          
          <div class="control-section">
            <label>Gear: {{gear}}</label>
            <div class="button-group">
              <button class="gear-button" mat-raised-button [color]="gear === 'forward' ? 'primary' : ''" (click)="setGear('forward')">Forward</button>
              <button class="gear-button" mat-raised-button [color]="gear === 'neutral' ? 'primary' : ''" (click)="setGear('neutral')">Neutral</button>
              <button class="gear-button" mat-raised-button [color]="gear === 'reverse' ? 'primary' : ''" (click)="setGear('reverse')">Reverse</button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .remote-control-container {
      position: fixed;
      top: 100px;
      left: 100px;
      z-index: 5000;
      width: 350px;
    }
    
    mat-card {
      background-color: #2a3f55;
      color: white;
      border: 2px solid #3a536c;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    }
    
    .title {
      display: flex;
      padding: 10px 15px;
      border-bottom: 1px solid #3a536c;
      background-color: #1e2d3e;
      border-radius: 8px 8px 0 0;
    }
    
    mat-card-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 25px;
    }
    
    .control-section {
      background-color: #345270;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #456789;
    }
    
    label {
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
      color: #ddd;
      text-transform: uppercase;
      font-size: 14px;
      text-align: center;
    }
    
    .horizontal-slider-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .vertical-slider-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 150px;
    }
    
    .limit-label {
      color: #aaa;
      font-size: 12px;
    }
    
    .slider {
      -webkit-appearance: none;
      background: #1e2d3e;
      outline: none;
      border-radius: 15px;
      border: 1px solid #456789;
    }
    
    .slider.horizontal {
      width: 100%;
      height: 20px;
    }
    
    .slider.vertical {
      -webkit-appearance: slider-vertical;
      width: 20px;
      height: 100px;
      margin: 10px 0;
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 25px;
      height: 25px;
      background: #f0f0f0;
      border-radius: 50%;
      border: 2px solid #1976d2;
      cursor: pointer;
    }
    
    .gear-button {
      margin: 5px;
      width: 100%;
    }
    
    .button-group {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class RemoteControlComponent {
  @Output() closed = new EventEmitter<void>();

  rudder = 0;   // Degrees, -30 to +30
  thrust = 0;   // 0% to 100%
  gear: 'forward' | 'neutral' | 'reverse' = 'neutral';

  constructor(
    private app: AppFacade
  ) {}

  sendRudderCommand(value: number) {
    console.log(`Sending rudder command: ${value}`);
    if (
      this.app.data.moosIvPServer &&
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      this.app.data.moosIvPServer.socket.send(`DESIRED_RUDDER=${value}`);
    }
  }

  sendThrustCommand(value: number) {
    console.log(`Sending thrust command: ${value}`);
    if (
      this.app.data.moosIvPServer &&
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      this.app.data.moosIvPServer.socket.send(`DESIRED_THRUST=${value}`);
    }
  }

  setGear(value: 'forward' | 'neutral' | 'reverse') {
    console.log(`Setting gear to: ${value}`);
    this.gear = value;
    
    // Convert gear to numeric value for MOOS-IvP
    let gearValue = 0; // neutral
    if (value === 'forward') gearValue = 1;
    if (value === 'reverse') gearValue = -1;
    
    if (
      this.app.data.moosIvPServer &&
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      this.app.data.moosIvPServer.socket.send(`DESIRED_GEAR=${gearValue}`);
    }
  }

  closePanel() {
    console.log("Closing remote control panel");
    
    // Send CONTROLE_MANUAL=false when closing the panel
    if (
      this.app.data.moosIvPServer &&
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      console.log("Sending CONTROLE_MANUAL=false to MOOS-IvP");
      this.app.data.moosIvPServer.socket.send("CONTROLE_MANUAL=false");
    }
    
    // Also update the button state
    this.app.config.selections.remoteControl = false;
    this.app.saveConfig();
    
    // Emit close event to parent
    this.closed.emit();
  }
}