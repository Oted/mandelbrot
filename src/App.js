import React, { Component } from 'react';
import './App.css';
// let Mandelbrot = importScripts('./utils/mandelbrot.js');
// console.log(Mandelbrot);
let Mandelbrot = new Worker('/mandelbrot.js');

/**
1.	Seahorse Valley
-0.75, 0.1

2.	Elephant Valley
0.275, 0

3.	Triple Spiral Valley
-0.088,0.654

4.	Quad-Spiral Valley
0.274,0.482

7.	Double Scepter Valley
-0.1002,0.8383

5.	Scepter Valley
-1.36,0.005

8.	Mini Mandelbrot
-1.75,0

6.	Scepter Variant
-1.108,
0.230

9.	Another Mandelbrot
-0.1592,-1.0317
**/

class App extends Component {
  constructor() {
    super();

    this.height = 800;
    this.width = 1000;
    // this._setScopeValues(-1.061, -0.460999, -0.08249999999999996, 0.5175000000000001);
    this._setScopeValues(-2, 1, -1.5, 1.5);
    // this._setScopeValues(-0.83642857142857131, -0.68642857142857142, 0.057857142857142793, 0.20785714285714284);

    this.cache = [];
    this.state = {
      'progress' : 0,
      'loading' : false,
      'zoom' : 1
    }
  }

  _setScopeValues(xMin, xMax, yMin, yMax) {
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;
    this.scale = 10;

    //calc x trasl factors
    this.xDelt = this.xMax - this.xMin;
    this.xNegRatio = Math.abs(this.xMax <= 0 ? 1 : this.xMin >= 0 ? 0 : this.xMin / this.xDelt);
    this.xNegSection = Math.abs(this.xNegRatio * this.width);
    this.xNegDeltSection = this.xDelt * this.xNegRatio;

    this.xPosRatio = 1 - this.xNegRatio;
    this.xPosSection = Math.abs(this.xPosRatio * this.width);
    this.xPosDeltSection = this.xDelt * this.xPosRatio;

    //calc y trasl factorn
    this.yDelt = this.yMax - this.yMin;
    this.yNegRatio = Math.abs(this.yMax <= 0 ? 1 : this.yMin >= 0 ? 0 : this.yMin / this.yDelt);
    this.yNegSection = Math.abs(this.yNegRatio * this.height);
    this.yNegDeltSection = this.yDelt * this.yNegRatio;

    this.yPosRatio = 1 - this.yNegRatio;
    this.yPosSection = Math.abs(this.yPosRatio * this.height);
    this.yPosDeltSection = this.yDelt * this.yPosRatio;


    this.nMax = 100 * (this.state ? this.state.zoom : 1);
    this.stepps = this.xDelt / 2500;

    console.log(this);
  }

  componentDidMount() {
    Mandelbrot.postMessage([this.xMin, this.xMax, this.yMin, this.yMax, this.nMax, this.stepps]);

    Mandelbrot.onmessage = (e) => {
      if (Array.isArray(e.data) && e.data.length === 2) {
        let type = e.data[0];
        let data = e.data[1];
        switch (type) {
          case "draw" :
            return this._draw.call(this, data);
          case "progress" :
            let loading = data > 0.98 ? false : true;
            return this.setState({'progress' : data, loading});
        }
      } else {
        console.log('invalid message from worker', e.data);
      }
    }
  }

  render() {
    return (
      <div className="App">
        <div style={{width:this.state.progress * 100 + '%'}} className='progress'> <span> {this.state.loading ? 'Loading...' : 'Done!'}</span> </div>
        <canvas
          id="canvas"
          width={this.width}
          onClick={(e) => { this._clicked(e)}}
          height={this.height}>
        </canvas>
      </div>
    );
  }

  _clicked(e) {
    if (this.state.loading) {
      return alert('its still lodaing');
    }

    var rect = this.canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    let xStep = (this.xMax - this.xMin) / this.width
    let yStep = (this.yMax - this.yMin) / this.height

    let xCoord = this.xMin + xStep * x;
    let yCoord = this.yMax - yStep * y;

    let xMin = xCoord - (this.xDelt / this.scale);
    let xMax = xCoord + (this.xDelt / this.scale);

    let yMin = yCoord - (this.yDelt / this.scale);
    let yMax = yCoord + (this.yDelt / this.scale);

    this.ctx.fillStyle = "rgba("+255+","+0+","+0+",1)";
    this.ctx.beginPath();
    this.ctx.moveTo(this._translateX(xMin),this._translateY(yMax));
    this.ctx.lineTo(this._translateX(xMax),this._translateY(yMax));
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this._translateX(xMax),this._translateY(yMax));
    this.ctx.lineTo(this._translateX(xMax),this._translateY(yMin));
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this._translateX(xMax),this._translateY(yMin));
    this.ctx.lineTo(this._translateX(xMin),this._translateY(yMin));
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this._translateX(xMin),this._translateY(yMin));
    this.ctx.lineTo(this._translateX(xMin),this._translateY(yMax));
    this.ctx.stroke();

    this._setScopeValues(xMin, xMax, yMin, yMax);
    if (this.ctx && this.canvas) {
      // this.ctx.clearRect(0, 0, this.width, this.height);
    }

    Mandelbrot.postMessage([this.xMin, this.xMax, this.yMin, this.yMax, this.nMax, this.stepps]);
    this.setState({'zoom' : this.state.zoom + 1});
  }

  _draw(arr, progress) {
    const oldC = this.ctx;
    window.requestAnimationFrame(() => {
      this.canvas = this.canvas || document.getElementById('canvas');

      if (this.canvas) {
        this.ctx = this.ctx || this.canvas.getContext('2d');

        if (!oldC) {
          this.imageD = this.ctx.createImageData(1,1);
        }

        let iter = 0;
        arr.forEach((item) => {
          if (progress) {
             iter % 3 === 0 ? progress(iter++ / arr.length) : void 0;
          } else {
            this.cache.push(item);
          }

          this._drawPoint(item);
        });
      }
    });
  }

  _drawPoint(item) {
    let x = item[0];
    let y = item[1];
    let n = item[2];

    let r = 0;
    let g = 0;
    let b = 0;

    let c =  1 - n / this.nMax;

    if (c < 1) {
      r = Math.floor(255 * Math.sin(c));
      g = Math.floor(255 * Math.sin(c**2));
      // b = Math.floor(255 * c);
    }
    // let d = this.imageD.data;

    // d[0] = r;
    // d[1] = g;
    // d[2] = b;
    // d[3] = 128;

    // this.ctx.putImageData(this.imageD,this._translateX(x),this._translateY(y));

    this.ctx.fillStyle = "rgba("+r+","+g+","+b+",1)";
    this.ctx.fillRect(
      this._translateX(x),
      this._translateY(y),
      1,
      1
    );
  }

  _translateX(x) {
    let newX = 0;

    if (x >= 0) {
      //if were only on the positive plane
      if (this.xPosRatio === 1) {
        newX = this.xPosSection * ((x - this.xMin) / this.xDelt);
      } else {
        newX = this.xNegSection + this.xPosSection * (x / this.xPosDeltSection);
      }
    } else {
      //if were only on the neg plane
      if (this.xNegRatio === 1) {
        newX = this.xNegSection * ((x - this.xMin) / this.xDelt);
      } else {
        newX = this.xNegSection - this.xNegSection * (x / this.xNegDeltSection) * -1;
      }
    }

    return parseInt(newX);
  }

  _translateY(y) {
    let newY = 0;

    if (y >= 0) {
      //if were only on the positive plane
      if (this.yPosRatio === 1) {
        newY = this.yPosSection * ((y - this.yMin) / this.yDelt);
      } else {
        newY = this.yPosSection - this.yPosSection * (y / this.yPosDeltSection);
      }
    } else {
      //if were only on the neg plane
      if (this.yNegRatio === 1) {
        newY = this.yNegSection * ((y - this.yMin) / this.yDelt);
      } else {
        newY = this.yPosSection + this.yNegSection * (y / this.yNegDeltSection) * -1;
      }
    }

    return parseInt(newY);
  }
}

export default App;
