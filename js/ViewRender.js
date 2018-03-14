

class ViewRender {

  constructor(obj) {
    this.width = obj.width;
    this.height = obj.height;
    this.wrapper = obj.wrapper;
    this.size = obj.cellSize;
    this.lines = obj.lines;
    this.pallete = obj.pallete;

    this.bgColor = this.pallete.black;


    var layerFactory = new LayersFactory({
        size: [this.width, this.height],
        wrap: this.wrapper
    });


    this.layers = {
      back: layerFactory.create('back', 1)
    }
    // Layer to put data
    this.activeLayer = this.layers.back;

    this.loadImages();
  }

  onReady(fn) {
    this._onReadCallback = fn;
  }

  // Fill background
  drawBackground() {
    this.activeLayer.fillAll(this.bgColor);
  }

  loadImages() {
    this.fontImage = new Image();
    this.fontImage.onload = () => {

      this.compileFonts();

      this.drawBackground();

      // View Ready
      if (this._onReadCallback) {
        this._onReadCallback();
      }
    }
    this.fontImage.src = 'dos_font_black.png'

  }

  compileFonts() {
    this.fontColors = {};
    for (var color in this.pallete) {
      this.fontColors[color] =this.copyFont(this.pallete[color]);
    }
  }

  //* font generator * //
  getFonts() {
    var cnv = document.createElement('canvas');
    cnv.style.background = 'transparent';
    cnv.style.position = 'absolute';
    this.wrapper.appendChild(cnv);
    var cxt = new Layer(cnv, 512, 512, 3, '');
    var i = 0;
    var x = 0;
    var y = 0;
    var tileSize = 128;

    for (var cnv in this.fontColors) {
      if (x > 0 && x % 4 == 0) {
        x = 0;
        y++;
      }
      cxt.drawImage(cnv,
        0,0,
        tileSize, tileSize,
        x * tileSize, y * tileSize,
        tileSize, tileSize,
      )
      x++;
    }
  }

  copyFont(color) {
    var cnv = document.createElement('canvas');
    var w = this.fontImage.width;
    var h = this.fontImage.height;
    var layer = new Layer(cnv, w, h, 0, '');
    layer.cxt.drawImage(this.fontImage, 0, 0);
    // Invert
    layer.cxt.globalCompositeOperation = 'source-in';
    // Fill all clipped area exept char with color
    layer.set('fillStyle', color);
    layer.fillRect(0, 0, w, h);
    return layer.cnv;
  }

  drawButton(b) {
    var color = b.active ? 'black' : 'white'
    var color_sec = b.active ? 'black': 'grey'
    var bgColor = b.active ? 'white': 'black';
    var bgColor_sec = b.active ? 'grey': 'black';
    if (b.disabled) {
      color = color_sec = 'grey';
      bgColor = bgColor_sec = 'black';
    }

    this._text('[', b.x, b.y, color_sec, bgColor_sec);
    this._text(b.text, b.x + 1 , b.y, color, bgColor);
    this._text(']', b.x + b.w - 1, b.y, color_sec, bgColor_sec);
  }


  drawText(text, coords, color, bgcolor) {
    var size = this.size;
    var x = coords.x * size;
    var y = coords.y * size;

    this.font = this.fontColors[color];

    var dx = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] == "\n") {
        y += size;
        dx = 0;
        continue;
      }
      this.drawChar(text[i], x + dx * size, y, bgcolor);
      dx++;
    }
  }

  _text(text, x, y, color, bgcolor) {
    this.drawText(text,{x: x, y: y}, color, bgcolor);
  }

  setFont(color) {
    this.font = this.fontColors[color];
  }

  drawChar(char, x, y, bgcolor, charSize) {
    const cxt = this.activeLayer;
    var size = charSize || this.size;

    var fontSize = 8;
    var code = char.charCodeAt();
    var cy = parseInt(code / 16, 10) * (fontSize+1) + 1;
    var cx = (code % 16) * (fontSize+1) + 1;

    // Clear
    cxt.set('fillStyle', bgcolor || this.bgColor);
    cxt.fillRect(x, y, size, size);

    // Draw char
    cxt.drawImage(this.font,
      cx, cy, fontSize, fontSize,
      x, y,
      size, size
    );
  }

  drawColor(coords, color) {
    var size = this.size;
    var x = coords.x * size;
    var y = coords.y * size;
    const cxt = this.activeLayer;
    // Clear
    cxt.set('fillStyle', color);
    cxt.fillRect(x, y, size, size);
  }

  drawSymbol(index, coords, color, bgcolor) {
    var size = this.size;
    var x = coords.x * size;
    var y = coords.y * size;
    this.font = this.fontColors[color];

    const cxt = this.activeLayer;
    var fontSize = 8;
    var code = index;
    var cy = parseInt(code / 16, 10) * 9 + 1;
    var cx = (code % 16) * 9 + 1;

    // Clear
    cxt.set('fillStyle', bgcolor || this.bgColor);
    cxt.fillRect(x, y, size, size);

    // Draw char
    cxt.drawImage(this.font,
      cx, cy, fontSize, fontSize,
      x, y,
      size, size
    );

  }

  moveLines(coords, height, width, direction, cut) {
    var cxt = this.activeLayer;
    var size = this.size;
    var x = coords.x * size;
    var y = coords.y * size;
    var w = width * size;
    var h = height *size;

    cxt.drawImage(cxt.cnv,
      x, y, w, h - (direction * size),
      x, y + direction * size, w, h - (direction * size));
  }


  drawAllocated(count, active) {
    var offset = {x:19, y:38}
    this._text('LOC:', offset.x, offset.y, 'grey');

    var countStr = count.toString(16).toUpperCase();
    if (countStr.length == 1) countStr = '0' + countStr;
    this._text(countStr, offset.x + 5, offset.y, active ? 'yellow':'grey');

  }

  drawCycles(count) {
    var offset = {x:6, y:38}
    this._text('CYCLES:', offset.x, offset.y, 'grey');
    if (!count) {
      this._text('0000', offset.x + 8, offset.y, 'grey');
    } else {
      var countStr = count.toString(16).toUpperCase()
      var leadZeros = 4 - countStr.length;
      if (leadZeros > 0) {
        countStr = new Array(leadZeros).fill('0').join('') + countStr;
      } else {
        countStr = countStr.substr(-4);
      }
      this._text(countStr, offset.x + 8, offset.y, 'orange');
    }
  }

  saveArea(area) {
    if (!this.cache) {
      var cnv = document.createElement('canvas');
      var layer = new Layer(cnv, 64, 64, 0, '');
      this.cache = layer;
    }

    area.x *= this.size;
    area.y *= this.size;
    area.w *= this.size;
    area.h *= this.size;

    var cxt = this.activeLayer;
    this.cache.drawImage(cxt.cnv,
      area.x, area.y,
      area.w, area.h,
      0,0,
      area.w, area.h,
    );

    return area;
  }

  restoreArea(area) {
    var cxt = this.activeLayer;
    cxt.drawImage(this.cache.cnv,
      0,0,
      area.w, area.h,
      area.x, area.y,
      area.w, area.h,
    )
  }

}
