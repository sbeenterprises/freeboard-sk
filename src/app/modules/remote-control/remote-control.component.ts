import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'remote-control',
  template: `
    <div class="remote-control-container">
      <h3>Remote Control</h3>

      <!-- Rudder Control -->
      <div class="control-group">
        <label for="rudder">Rudder:</label>
        <input
          id="rudder"
          type="range"
          min="-45"
          max="45"
          step="1"
          [(ngModel)]="rudder"
          (change)="onControlChange()"
        />
        <span>{{ rudder }}°</span>
      </div>

      <!-- Thrust Control -->
      <div class="control-group">
        <label for="thrust">Thrust:</label>
        <input
          id="thrust"
          type="range"
          min="0"
          max="100"
          step="1"
          [(ngModel)]="thrust"
          (change)="onControlChange()"
        />
        <span>{{ thrust }}%</span>
      </div>

      <!-- Gear Control -->
      <div class="control-group">
        <label for="gear">Gear:</label>
        <select id="gear" [(ngModel)]="gear" (change)="onControlChange()">
          <option value="forward">Forward</option>
          <option value="neutral">Neutral</option>
          <option value="reverse">Reverse</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="control-actions">
        <button mat-raised-button color="primary" (click)="applyChanges()">
          Apply
        </button>
        <button mat-raised-button color="accent" (click)="closePanel()">
          Close
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .remote-control-container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .control-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
    `,
  ],
})
export class RemoteControlComponent {
  @Output() close = new EventEmitter<void>();

  // Example local state
  rudder = 0;   // Degrees, -45 to +45
  thrust = 0;   // 0% to 100%
  gear: 'forward' | 'neutral' | 'reverse' = 'neutral';

  /**
   * Whenever user moves sliders or changes gear, you might want
   * to do something live or store it for "Apply".
   */
  onControlChange() {
    // Typically you could fire an event or do something like:
    // this.remoteService.updateControls({ rudder, thrust, gear });
  }

  /**
   * Called when user hits 'Apply'.  Send final control states to your backend.
   */
  applyChanges() {
    const controlPayload = {
      rudder: this.rudder,
      thrust: this.thrust,
      gear: this.gear,
    };
    console.log('Applying Remote Control changes:', controlPayload);
    // e.g. this.remoteService.applyControlSettings(controlPayload);
  }

  /**
   * Simply emit an event to parent so we can hide the panel.
   */
  closePanel() {
    this.close.emit();
  }
}
