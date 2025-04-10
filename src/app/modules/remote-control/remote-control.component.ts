import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { AppFacade } from 'src/app/app.facade';
import { TextDialComponent, TTGDialComponent } from 'src/app/lib/components/dial-text';

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
    TextDialComponent,
    TTGDialComponent
  ],
  template: `
    <div class="remote-control-sidebar">
      <div class="sidebar-header">
        <span class="title">Remote Control</span>
        <button mat-icon-button (click)="closePanel()" matTooltip="Close panel">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <!-- Navigation Data Section -->
      <div class="nav-data-section">
        <div class="nav-data-header">Navigation Data</div>
        
        <div class="navigation-data">
          <!-- Display navigation data similarly to navdataPanel -->
          <div class="nav-data-row">
            <!-- Course Over Ground -->
            @if(navData?.bearing?.value) {
              <ap-dial-text
                [title]="'COG'"
                [value]="navData.bearing.value.toFixed(1)"
                [units]="navData.bearing.type === 'M' ? 'deg (M)' : 'deg (T)'"
              ></ap-dial-text>
            }
            
            <!-- Speed Over Ground -->
            @if(navData?.vmg) {
              <ap-dial-text
                [title]="'SOG'"
                [value]="app.formatSpeed(navData.vmg, true)"
                [units]="app.formattedSpeedUnits"
              ></ap-dial-text>
            }
          </div>
          
          <div class="nav-data-row">
            <!-- Position -->
            @if(navData?.position) {
              <ap-dial-text
                [title]="'Position'"
                [value]="formatPosition(navData.position)"
                [units]="''"
              ></ap-dial-text>
            }
          </div>
          
          <div class="nav-data-row">
            <!-- Distance To Go -->
            @if(navData?.dtg) {
              <ap-dial-text
                [title]="'DTG'"
                [value]="navData.dtg.toFixed(1)"
                [units]="app.config.units.distance === 'm' ? 'km' : 'NM'"
              ></ap-dial-text>
            }
            
            <!-- Time To Go -->
            @if(navData?.ttg) {
              <ap-dial-ttg
                [value]="navData.ttg"
              ></ap-dial-ttg>
            }
          </div>
        </div>
      </div>
      
      <!-- Remote Control Section -->
      <div class="control-panel">
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
          <div class="thrust-control-container">
            <div class="vertical-slider-container">
              <span class="limit-label">100%</span>
              <input class="slider vertical" type="range" min="0" max="100" [(ngModel)]="thrust" (change)="sendThrustCommand(thrust)" orient="vertical">
              <span class="limit-label">0%</span>
            </div>
            <div class="thrust-buttons">
              <button mat-mini-fab class="thrust-button" (click)="increaseThrust()" [disabled]="thrust >= 100">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-mini-fab class="thrust-button" (click)="decreaseThrust()" [disabled]="thrust <= 0">
                <mat-icon>remove</mat-icon>
              </button>
            </div>
          </div>
        </div>
        
        <div class="control-section">
          <label>Gear: {{gear}}</label>
          <div class="button-group">
            <button class="gear-button" 
                    mat-raised-button 
                    [ngClass]="{'green-gear-button': gear === 'forward'}" 
                    (click)="setGear('forward')">Forward</button>
            <button class="gear-button" 
                    mat-raised-button 
                    [ngClass]="{'green-gear-button': gear === 'neutral'}" 
                    (click)="setGear('neutral')">Neutral</button>
            <button class="gear-button" 
                    mat-raised-button 
                    [ngClass]="{'green-gear-button': gear === 'reverse'}" 
                    (click)="setGear('reverse')">Reverse</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Sidebar layout styles */
    :host {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: #2a3f55;
      color: white;
    }
    
    .remote-control-sidebar {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: #2a3f55;
      color: white;
    }
    
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #1e2d3e;
      border-bottom: 1px solid #3a536c;
    }
    
    .sidebar-header .title {
      font-size: 16pt;
      font-weight: 500;
    }
    
    /* Navigation data section */
    .nav-data-section {
      padding: 10px;
      border-bottom: 1px solid #3a536c;
    }
    
    .nav-data-header {
      font-size: 14pt;
      font-weight: 500;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .navigation-data {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .nav-data-row {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
    }
    
    /* Control panel section */
    .control-panel {
      flex: 1;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
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
    
    .thrust-control-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
    }
    
    .vertical-slider-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 150px;
    }
    
    .thrust-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .thrust-button {
      background-color: #1e2d3e;
      color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      width: 36px;
      height: 36px;
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
    
    /* Green button style for selected gear */
    .green-gear-button {
      background-color: #4CAF50 !important;
      color: white !important;
      border-color: #4CAF50 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
    }
    
    .green-gear-button:hover {
      background-color: #45a049 !important;
      color: white !important;
    }
    
    /* Override Angular Material styles with higher specificity */
    .control-section .button-group button.gear-button.green-gear-button {
      background-color: #4CAF50 !important;
      color: white !important;
    }
  `]
})
export class RemoteControlComponent {
  @Input() navData: any;
  @Output() closed = new EventEmitter<void>();

  rudder = 0;   // Degrees, -30 to +30
  thrust = 0;   // 0% to 100%
  gear: 'forward' | 'neutral' | 'reverse' = 'neutral';

  constructor(
    public app: AppFacade
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

  increaseThrust() {
    if (this.thrust < 100) {
      this.thrust += 1;
      this.sendThrustCommand(this.thrust);
    }
  }

  decreaseThrust() {
    if (this.thrust > 0) {
      this.thrust -= 1;
      this.sendThrustCommand(this.thrust);
    }
  }

  // Format position for display
  formatPosition(position: any): string {
    if (!position || !position[0] || !position[1]) {
      return '--';
    }
    // Format as simple lat/lon
    const lat = Math.abs(position[1]).toFixed(4) + (position[1] >= 0 ? '°N' : '°S');
    const lon = Math.abs(position[0]).toFixed(4) + (position[0] >= 0 ? '°E' : '°W');
    return `${lat} ${lon}`;
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