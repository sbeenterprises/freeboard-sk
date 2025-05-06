import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { AppFacade } from 'src/app/app.facade';
import { SKResources } from 'src/app/modules/skresources/resources.service';
import { HeadingPlotComponent } from './heading-plot.component';

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
    MatSelectModule
  ],
  template: `
    <div class="remote-control-sidebar" [class.autonomous-sidebar]="isAutonomous">
      <div class="sidebar-header" [class.autonomous-header]="isAutonomous">
        <span class="title">{{ isAutonomous ? 'Autonomous Control' : 'Remote Control' }}</span>
        <div>
          <button mat-icon-button (click)="closePanel()" matTooltip="Close panel">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      
      <!-- Navigation Data Section -->
      <div class="nav-data-section">
        <div class="nav-data-header">Navigation Data</div>
        
        <div class="navigation-data">
          <div class="nav-data-row">
            <!-- Course Over Ground -->
            <div class="data-box">
              <div class="data-title">COG</div>
              <div class="data-value">{{(app.data.vessels.self.cogTrue * 180 / Math.PI).toFixed(1)}}</div>
              <div class="data-units">deg (T)</div>
            </div>
            
            <!-- Speed Over Ground -->
            <div class="data-box">
              <div class="data-title">SOG</div>
              <div class="data-value">{{app.formatSpeed(app.data.vessels.self.sog, true)}}</div>
              <div class="data-units">{{app.formattedSpeedUnits}}</div>
            </div>
          </div>
          
          <div class="nav-data-row">
            <!-- Position -->
            <div class="data-box position-box">
              <div class="data-title">Position</div>
              <div class="data-value">{{formatPosition(app.data.vessels.self.position)}}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Control Section -->
      <div class="control-panel">
        <!-- Remote Control Section (shown only in remote control mode) -->
        <ng-container *ngIf="!isAutonomous">
          <div class="control-section">
            <label>Rudder: {{rudder}}°</label>
            <div class="horizontal-slider-container">
              <span class="limit-label">-30°</span>
              <input class="slider horizontal" type="range" min="-30" max="30" [(ngModel)]="rudder" (change)="sendRudderCommand(rudder)">
              <span class="limit-label">30°</span>
            </div>
            <button mat-raised-button class="center-rudder-button" (click)="centerRudder()">Center Rudder</button>
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
          
          <div class="control-section">
            <label>CAN Network</label>
            <div class="button-group">
              <button class="gear-button" 
                      mat-raised-button 
                      [ngClass]="{'green-gear-button': !canNetworkActive, 'button-warn': canNetworkActive}"
                      (click)="toggleCanNetwork()">
                {{ canNetworkActive ? 'Activate CAN Network' : 'Deactivate CAN Network' }}
              </button>
            </div>
          </div>
        </ng-container>
        
        <!-- Autonomous Control Section (shown only in autonomous control mode) -->
        <ng-container *ngIf="isAutonomous">
          <div class="control-section">
            <label>Route Selection</label>
            <div class="route-select-container">
              <mat-form-field appearance="fill" class="route-select">
                <mat-label>Select a route</mat-label>
                <mat-select [(ngModel)]="selectedRouteId" (selectionChange)="onRouteSelected()">
                  <mat-option *ngFor="let route of availableRoutes" [value]="route.id">
                    {{route.name}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
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
            <div class="autonomous-buttons">
              <button mat-raised-button class="autonomous-button" [ngClass]="{'green-button': autonomyStarted}" [color]="autonomyStarted ? '' : 'primary'" (click)="sendAutonomousCommand('start')">
                <mat-icon>play_arrow</mat-icon> Start
              </button>
              <button mat-raised-button class="autonomous-button" [ngClass]="{'green-button': autonomyStopped}" [color]="autonomyStopped ? '' : 'warn'" (click)="sendAutonomousCommand('stop')">
                <mat-icon>stop</mat-icon> Stop
              </button>
              <button mat-raised-button class="autonomous-button" (click)="sendAutonomousCommand('clear')">
                <mat-icon>clear_all</mat-icon> Clear Path
              </button>
              <button mat-raised-button class="autonomous-button" [ngClass]="{'green-button': returnToBaseActive}" [color]="returnToBaseActive ? '' : 'accent'" (click)="sendAutonomousCommand('return')">
                <mat-icon>home</mat-icon> Return to Base
              </button>
            </div>
          </div>
          
          <div class="control-section">
            <label>CAN Network</label>
            <div class="button-group">
              <button class="gear-button" 
                      mat-raised-button 
                      [ngClass]="{'green-gear-button': !canNetworkActive, 'button-warn': canNetworkActive}"
                      (click)="toggleCanNetwork()">
                {{ canNetworkActive ? 'Activate CAN Network' : 'Deactivate CAN Network' }}
              </button>
            </div>
          </div>
          
          <div class="control-section">
            <label>Data Visualization</label>
            <div class="button-group">
              <button class="gear-button"
                      mat-raised-button
                      color="primary"
                      (click)="openHeadingPlot()">
                <mat-icon>timeline</mat-icon> Plot Heading
              </button>
            </div>
          </div>
        </ng-container>
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
      padding-top: 0;
    }
    
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #1e2d3e;
      border-bottom: 1px solid #3a536c;
    }
    
    /* Adjusted styles for autonomous mode */
    :host-context(.autonomous-mode) .remote-control-sidebar {
      padding-top: 0;
    }
    
    .autonomous-sidebar {
      padding-top: 0 !important;
    }
    
    .autonomous-header {
      display: flex !important;
      justify-content: space-between;
      padding-left: 20px;
    }
    
    .sidebar-header .title {
      font-size: 16pt;
      font-weight: 500;
    }
    
    /* Navigation data section */
    .nav-data-section {
      padding: 15px;
      margin-bottom: 10px;
      background-color: #345270;
      border-radius: 8px;
      border: 1px solid #456789;
      margin: 15px;
    }
    
    .autonomous-sidebar .nav-data-section {
      margin-top: 0;
    }
    
    .nav-data-header {
      font-size: 14pt;
      font-weight: 500;
      margin-bottom: 15px;
      text-align: center;
      color: #ddd;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .navigation-data {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .nav-data-row {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      padding: 5px 0;
      border-radius: 4px;
    }
    
    .data-box {
      text-align: center;
      flex: 1;
      min-width: 100px;
      padding: 10px;
      border-radius: 4px;
    }
    
    .position-box {
      flex: 2;
      width: 100%;
    }
    
    .data-title {
      font-size: 12px;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 5px;
    }
    
    .data-value {
      font-size: 18px;
      font-weight: bold;
      color: white;
    }
    
    .data-units {
      font-size: 12px;
      color: #aaa;
      margin-top: 2px;
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
    
    .center-rudder-button {
      width: 40%;
      margin: 12px auto 0;
      display: block;
      padding: 4px 9px;
      font-size: 13px;
      height: 30px;
      line-height: 30px;
      background-color: #1e2d3e;
      color: white;
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
    
    /* Autonomous control styles */
    .autonomous-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .autonomous-button {
      height: 45px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .autonomous-button mat-icon {
      margin-right: 8px;
    }

    .route-select-container {
      padding: 0 10px;
    }

    .route-select {
      width: 100%;
    }
    
    /* Override Angular Material styles with higher specificity */
    .control-section .button-group button.gear-button.green-gear-button {
      background-color: #4CAF50 !important;
      color: white !important;
    }
    
    .green-button {
      background-color: #4CAF50 !important;
      color: white !important;
    }
    
    .button-warn {
      background-color: #f44336 !important;
      color: white !important;
    }
  `]
})
export class RemoteControlComponent implements OnInit {
  @Input() navData: any;
  @Output() closed = new EventEmitter<void>();

  rudder = 0;   // Degrees, -30 to +30
  thrust = 0;   // 0% to 100%
  gear: 'forward' | 'neutral' | 'reverse' = 'neutral';
  autonomyStarted = false;
  autonomyStopped = false;
  returnToBaseActive = false;
  selectedRouteId: string = '';
  availableRoutes: any[] = [];

  // Determine if we're in autonomous mode based on app configuration
  get isAutonomous(): boolean {
    return this.app.config.selections.autonomousControl || false;
  }

  // Make Math available in the template
  Math: any = Math;
  
  constructor(
    public app: AppFacade,
    private skResources: SKResources,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Force a refresh of routes when the component initializes
    this.skResources.getRoutes();
    // Set up a subscription to route updates
    this.skResources.update$().subscribe(update => {
      if (update && update['mode'] === 'route') {
        this.loadRoutes();
      }
    });
    // Initial load with a slight delay to ensure routes are fetched
    setTimeout(() => this.loadRoutes(), 500);
    
    // We don't send AUTONOMOUS_CONTROL=true automatically on initialization
    // This ensures autonomous control isn't automatically toggled when the app starts
  }
  
  canNetworkActive = false;

  loadRoutes() {
    console.log('Loading routes into dropdown...');
    // Get available routes from app.data.routes
    if (this.app.data.routes && this.app.data.routes.length > 0) {
      this.availableRoutes = this.app.data.routes.map(route => ({
        id: route[0],
        name: route[1].name || 'Unnamed Route',
        description: route[1].description
      }));
      console.log(`Loaded ${this.availableRoutes.length} routes`);
    } else {
      console.log('No routes available');
      this.availableRoutes = [];
      // Trigger another get routes attempt
      this.skResources.getRoutes();
    }
  }
  
  onRouteSelected() {
    if (this.selectedRouteId) {
      console.log(`Route selected: ${this.selectedRouteId}`);
      
      // Find the selected route
      const route = this.app.data.routes.find(r => r[0] === this.selectedRouteId);
      
      if (route && route[1] && route[1].feature && route[1].feature.geometry && route[1].feature.geometry.coordinates) {
        const waypoints = route[1].feature.geometry.coordinates;
        
        // Make only the selected route visible on the map
        this.app.data.routes.forEach(r => {
          // Set isSelected (third element) to true only for the selected route
          r[2] = (r[0] === this.selectedRouteId);
        });
        // Notify the map component that route selection has changed
        this.skResources.routeSelected();
        
        // Send waypoints to MOOS-IvP
        this.sendWaypointsToMOOS(waypoints);
      } else {
        console.error('Route coordinates not found');
      }
    }
  }
  
  sendWaypointsToMOOS(waypoints: any[]) {
    if (
      this.app.data.moosIvPServer &&
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      // Format waypoints as lat1,lon1:lat2,lon2:lat3,lon3...
      // Note that waypoints in SignalK are stored as [longitude, latitude]
      // but we need to send as latitude,longitude format
      const waypointString = waypoints.map(point => {
        // Extract lat and lon from the point and format
        const lat = point[1]; // Latitude is at index 1
        const lon = point[0]; // Longitude is at index 0
        return `${lat},${lon}`;
      }).join(':');
      
      // Send the formatted waypoint string
      this.app.data.moosIvPServer.socket.send(`AUTONOMOUS_WAYPOINTS=${waypointString}`);
      console.log('Sent waypoints to MOOS-IvP:', waypointString);
    } else {
      console.error('MOOS-IvP connection not available');
    }
  }

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
      // Send different command based on control mode
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
  
  centerRudder() {
    this.rudder = 0;
    this.sendRudderCommand(this.rudder);
  }
  
  toggleCanNetwork() {
    this.canNetworkActive = !this.canNetworkActive;
    console.log(`Toggling CAN Network: ${this.canNetworkActive ? 'Deactivated' : 'Activated'}`);
    
    if (
      this.app.data.moosIvPServer &&
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      // Send STOP_CAN=true to deactivate or STOP_CAN=false to activate
      this.app.data.moosIvPServer.socket.send(`STOP_CAN=${this.canNetworkActive}`);
    }
  }

  sendAutonomousCommand(command: 'start' | 'stop' | 'clear' | 'return') {
    console.log(`Sending autonomous command: ${command}`);
    
    let moosCommand = '';
    
    switch(command) {
      case 'start':
        // Make sure a route is selected before starting
        if (!this.selectedRouteId && !this.autonomyStarted) {
          console.warn('No route selected, cannot start autonomous navigation');
          this.app.showAlert('Please select a route first', 'No Route Selected');
          return;
        }
        
        this.autonomyStarted = !this.autonomyStarted;
        if (this.autonomyStarted) {
          this.autonomyStopped = false;
        }
        moosCommand = 'AUTONOMOUS_START=true';
        break;
      case 'stop':
        this.autonomyStarted = false;
        this.autonomyStopped = !this.autonomyStopped;
        moosCommand = 'AUTONOMOUS_STOP=true';
        break;
      case 'clear':
        this.autonomyStarted = false;
        this.autonomyStopped = false;
        this.returnToBaseActive = false;
        // Clear the selected route when clearing the path
        this.selectedRouteId = '';
        moosCommand = 'AUTONOMOUS_CLEAR_PATH=true';
        break;
      case 'return':
        this.returnToBaseActive = !this.returnToBaseActive;
        moosCommand = this.returnToBaseActive ? 'AUTONOMOUS_RETURN_TO_BASE=true' : 'AUTONOMOUS_RETURN_TO_BASE=false';
        break;
    }
    
    if (
      moosCommand &&
      this.app.data.moosIvPServer && 
      this.app.data.moosIvPServer.socket &&
      this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
    ) {
      this.app.data.moosIvPServer.socket.send(moosCommand);
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

  // Toggle the heading plot panel visibility
  openHeadingPlot() {
    this.app.sHeadingPlotShow.update(value => !value);
  }

  closePanel() {
    console.log("Closing control panel");
    
    if (this.isAutonomous) {
      // If closing autonomous control panel
      if (
        this.app.data.moosIvPServer &&
        this.app.data.moosIvPServer.socket &&
        this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
      ) {
        console.log("Sending AUTONOMOUS_CONTROL=false to MOOS-IvP");
        this.app.data.moosIvPServer.socket.send("AUTONOMOUS_CONTROL=false");
      }
      
      // Reset autonomous control states
      this.autonomyStarted = false;
      this.autonomyStopped = false;
      this.returnToBaseActive = false;
      this.selectedRouteId = '';
      
      // Update the autonomous control button state
      this.app.config.selections.autonomousControl = false;
    } else {
      // If closing remote control panel
      if (
        this.app.data.moosIvPServer &&
        this.app.data.moosIvPServer.socket &&
        this.app.data.moosIvPServer.socket.readyState === WebSocket.OPEN
      ) {
        console.log("Sending CONTROLE_MANUAL=false to MOOS-IvP");
        this.app.data.moosIvPServer.socket.send("CONTROLE_MANUAL=false");
      }
      
      // Update the remote control button state
      this.app.config.selections.remoteControl = false;
    }
    
    this.app.saveConfig();
    
    // Emit close event to parent
    this.closed.emit();
  }
}