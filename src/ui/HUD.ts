export class HUD {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    
    // Style the HUD container
    Object.assign(this.container.style, {
      position: 'absolute',
      top: '10px',
      left: '10px',
      padding: '10px',
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '4px',
      pointerEvents: 'none', // Let clicks pass through to canvas
      userSelect: 'none',
      zIndex: '1000'
    });

    document.body.appendChild(this.container);
  }

  public update(
    beta: number, 
    gamma: number, 
    gravityMag: number, 
    inputMode: string, 
    debugMode: boolean
  ): void {
    const safeBeta = beta.toFixed(1);
    const safeGamma = gamma.toFixed(1);
    const safeMag = gravityMag.toFixed(2);

    let html = `
      <div><strong>MODE:</strong> ${inputMode}</div>
      <div style="margin-top: 5px">
        Beta (F/B): <span style="color:${Math.abs(beta) > 80 ? 'red' : 'white'}">${safeBeta}°</span><br>
        Gamma (L/R): ${safeGamma}°
      </div>
      <div style="margin-top: 5px; border-top: 1px solid #555; padding-top: 5px;">
        Gravity: ${safeMag} m/s²
      </div>
    `;

    if (debugMode) {
      html += `
        <div style="margin-top: 8px; color: #ffff00; font-size: 0.9em">
          [DEBUG ACTIVE]<br>
          Press 'D' to toggle<br>
          Space to Reset
        </div>
      `;
    }

    this.container.innerHTML = html;
  }
}