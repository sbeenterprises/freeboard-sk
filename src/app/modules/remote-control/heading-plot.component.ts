import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { AppFacade } from 'src/app/app.facade';
import * as Plotly from 'plotly.js-dist';

@Component({
  selector: 'heading-plot',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CdkDrag
  ],
  template: `
    <mat-card appearance="outlined">
      <div class="heading-plot-main mat-app-background" cdkDrag>
        <div class="title" cdkDragHandle>
          <div style="width: 60px;">
            &nbsp;
          </div>
          <div
            style="flex: 1 1 auto;
            font-size: 14pt;
            line-height: 2.5em;
            text-align: center;
            cursor: grab;"
          >
            Heading Plot
          </div>
          <div>
            <button mat-icon-button (click)="handleClose()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <div class="content">
          <div class="plot-container">
            <div #plotElement class="plot-element"></div>
          </div>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .heading-plot-main {
      position: fixed;
      z-index: 6100;
      --hA: 100vh;
      --lA: 100vw;
      top: calc((var(--hA)* .1));
      left: calc((var(--lA)* .1));
      display: flex;
      flex-direction: column;  
      font-family: Roboto, Arial, Helvetica, sans-serif; 
      width: 90vw;
      max-width: 650px;
      height: 40vh;
      border: 2px gray solid;
    }
    
    .heading-plot-main .title {
      padding: 3px 5px 0 5px;
      font-weight: 500;
      font-size: 14px;
      line-height: 23px;
      display: flex;
    }
    
    .heading-plot-main .content {
      padding: 0 5px;
      line-height: 23px;
      margin: 0;
      flex: 1 1 auto;
      overflow: hidden;
      text-align: center;
      display: flex;
      flex-direction: column;
    }
    
    .plot-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background-color: #345270;
      border-radius: 8px;
      padding: 10px;
    }
    
    .plot-element {
      width: 100%;
      height: 100%;
    }
  `]
})
export class HeadingPlotComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('plotElement') plotElement: ElementRef;
  @Output() closed: EventEmitter<void> = new EventEmitter();

  private plot: any;
  private updateInterval: any;
  
  // Data points for the graph
  private timestamps: Date[] = [];
  private desiredHeadings: number[] = [];
  private actualHeadings: number[] = [];
  
  // Maximum number of data points to show
  private readonly MAX_POINTS = 100;

  constructor(private app: AppFacade) {}

  ngOnInit(): void {
    // Start listening for heading updates
    this.updateInterval = setInterval(() => this.updatePlot(), 1000);
  }

  ngAfterViewInit(): void {
    this.initPlot();
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.plot) {
      Plotly.purge(this.plotElement.nativeElement);
    }
  }

  initPlot(): void {
    const layout = {
      title: 'Heading vs. Desired Heading',
      font: { color: '#ffffff' },
      paper_bgcolor: '#345270',
      plot_bgcolor: '#2a3f55',
      xaxis: {
        title: 'Time',
        showgrid: true,
        gridcolor: '#456789',
        tickformat: '%H:%M:%S',
        color: '#ffffff'
      },
      yaxis: {
        title: 'Heading (degrees)',
        showgrid: true,
        gridcolor: '#456789',
        range: [0, 360],
        color: '#ffffff'
      },
      legend: {
        font: { color: '#ffffff' }
      },
      margin: { l: 60, r: 30, t: 40, b: 60 }
    };

    const data = [{
      x: this.timestamps,
      y: this.desiredHeadings,
      type: 'scatter',
      mode: 'lines',
      name: 'Desired Heading',
      line: { color: '#1976d2', width: 2 }
    }, {
      x: this.timestamps,
      y: this.actualHeadings,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Heading',
      line: { color: '#4CAF50', width: 2 }
    }];

    const config = {
      responsive: true
    };

    Plotly.newPlot(this.plotElement.nativeElement, data, layout, config);
    this.plot = this.plotElement.nativeElement;
  }

  updatePlot(): void {
    // Check if MOOS-IvP socket is available
    if (
      !this.app.data.moosIvPServer ||
      !this.app.data.moosIvPServer.lastMessage
    ) {
      return;
    }

    // Get the latest heading data from the MOOS-IvP message
    const lastMessage = this.app.data.moosIvPServer.lastMessage;
    
    // Parse heading values from the message
    // Expected format: "DESIRED_HEADING=206.000000/NAV_HEADING=306.608869"
    if (typeof lastMessage === 'string' && 
        lastMessage.includes('DESIRED_HEADING=') && 
        lastMessage.includes('NAV_HEADING=')) {
      
      try {
        // Extract desired heading
        const desiredMatch = lastMessage.match(/DESIRED_HEADING=(\d+\.\d+)/);
        const desiredHeading = desiredMatch ? parseFloat(desiredMatch[1]) : null;
        
        // Extract actual heading
        const actualMatch = lastMessage.match(/NAV_HEADING=(\d+\.\d+)/);
        const actualHeading = actualMatch ? parseFloat(actualMatch[1]) : null;
        
        if (desiredHeading !== null && actualHeading !== null) {
          // Add new data points
          const now = new Date();
          this.timestamps.push(now);
          this.desiredHeadings.push(desiredHeading);
          this.actualHeadings.push(actualHeading);
          
          // Limit the number of data points to keep the graph responsive
          if (this.timestamps.length > this.MAX_POINTS) {
            this.timestamps.shift();
            this.desiredHeadings.shift();
            this.actualHeadings.shift();
          }
          
          // Update the plot
          const update = {
            x: [[...this.timestamps], [...this.timestamps]],
            y: [[...this.desiredHeadings], [...this.actualHeadings]]
          };
          
          Plotly.update(this.plot, update, {}, [0, 1]);
        }
      } catch (err) {
        console.error('Error parsing heading data:', err);
      }
    }
  }

  handleClose(): void {
    this.closed.emit();
  }
}