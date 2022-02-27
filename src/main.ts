import { ProgramInfo, ObjectType, AppState, GLObjectData, AppData } from "./interface";
import { init, initShader, initShaderFiles } from "./utils/init";
import { download, recalcPosBuf } from "./utils/tools";

import GLObject from "./objects/GLObject";
import GLObjectList from "./objects/GLObjectList";

let isMouseDown = false;
let mousePos: [number, number] = [0, 0];
let mousePosVertNormalized: [number, number] = [0, 0];
let vertex_array_buffer = [];
let appState: AppState = AppState.Select;
let drawingContext = null;
let sisa_vertex = 0;
let mouseHoverObjId = 0;
let mouseHoverVertId = -1;
let previouslySelectedObjId = -1;
let lastSelectedObjId = -1;
let lastSelectedVertId = -1;
let totalObj = 0;

let program_info: ProgramInfo = {};
let glReference: WebGL2RenderingContext;

let loadFileInput = null;

function setupUI(gl_object_list: GLObjectList) {
  const draw_line_button = document.getElementById("draw-line") as HTMLButtonElement;
  const draw_square_button = document.getElementById("draw-square") as HTMLButtonElement;
  const draw_rectangle_button = document.getElementById("draw-rectangle") as HTMLButtonElement;
  const draw_polygon_button = document.getElementById("draw-polygon") as HTMLButtonElement;
  const load_button = document.getElementById("load-button") as HTMLButtonElement;
  const save_button = document.getElementById("save-button") as HTMLButtonElement;
  const x_position_input = document.getElementById("x-pos-range") as HTMLInputElement;
  const y_position_input = document.getElementById("y-pos-range") as HTMLInputElement;
  // const select_button = document.getElementById("select-button") as HTMLInputElement;
  // const move_button = document.getElementById("move-button") as HTMLInputElement;
  const color_input = document.getElementById("color-pallete") as HTMLInputElement;
  const scale_button = document.getElementById("scale-button") as HTMLInputElement;
  const x_scale_input = document.getElementById("x-scale-input") as HTMLInputElement;
  const y_scale_input = document.getElementById("y-scale-input") as HTMLInputElement;

  draw_line_button.addEventListener("click", () => {
    draw_line();
  });
  draw_square_button.addEventListener("click", () => {
    draw_square();
  });
  draw_rectangle_button.addEventListener("click", () => {
    draw_rectangle();
  });
  draw_polygon_button.addEventListener("click", () => {
    draw_polygon();
  });

  load_button.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    const readFile = (e) => {
      const file = e.target.files[0];
      if (!file) {
        document.body.removeChild(loadFileInput);
        loadFileInput = null;
        return;
      }
      const fileReader = new FileReader();
      fileReader.onload = (evt) => {
        const content = evt.target.result as string;
        const parsed = JSON.parse(content) as AppData;
        gl_object_list.load(parsed.gl_object_data, program_info.shader_program, glReference);
        document.body.removeChild(loadFileInput);
        loadFileInput = null;
        drawScene(glReference, program_info);
      };
      fileReader.readAsText(file);
    };
    fileInput.onchange = readFile;
    document.body.appendChild(fileInput);
    loadFileInput = fileInput;
    fileInput.click();
  });
  save_button.addEventListener("click", () => {
    const data: GLObjectData[] = gl_object_list.getAllObjectData();
    const fileContent: AppData = {
      created_at: new Date(),
      gl_object_data: data,
    };
    download(JSON.stringify(fileContent), "CADKel13-data.json", "application/json");
  });

  // select_button.addEventListener("click", () => {
  //   appState = AppState.Select;
  // });
  // move_button.addEventListener("click", () => {
  //   appState = AppState.Move;
  // });
  scale_button.addEventListener("click", () => {
    appState = AppState.Scale;
  });

  x_position_input.addEventListener("input", () => {
    if (lastSelectedObjId > 0) {
      const obj = gl_object_list.getObject(lastSelectedObjId);
      const [xPos, yPos] = obj.position;
      const [x, y] = [parseInt(x_position_input.value), parseInt(y_position_input.value)];
      obj.setPosition(x, y);
      document.getElementById("x-pos-val").innerText = xPos.toString();
      document.getElementById("y-pos-val").innerText = yPos.toString();
    }
  });
  y_position_input.addEventListener("input", () => {
    if (lastSelectedObjId > 0) {
      const obj = gl_object_list.getObject(lastSelectedObjId);
      const [xPos, yPos] = obj.position;
      const [x, y] = [parseInt(x_position_input.value), parseInt(y_position_input.value)];
      obj.setPosition(x, y);
      document.getElementById("x-pos-val").innerText = xPos.toString();
      document.getElementById("y-pos-val").innerText = yPos.toString();
    }
  });

  color_input.addEventListener("input", () => {
    if (lastSelectedObjId > 0) {
      const obj = gl_object_list.getObject(lastSelectedObjId);
      const color = HexToColor(color_input.value);
      obj.setColor([color.r, color.g, color.b, 1]);
    }
  });

  x_scale_input.addEventListener("change", () => {
    if (lastSelectedObjId > 0) {
      const obj = gl_object_list.getObject(lastSelectedObjId);
      const [x, y] = [parseFloat(x_scale_input.value), parseFloat(y_scale_input.value)];
      obj.setScale(x, y);
    }
  });
  y_scale_input.addEventListener("change", () => {
    if (lastSelectedObjId > 0) {
      const obj = gl_object_list.getObject(lastSelectedObjId);
      const [x, y] = [parseFloat(x_scale_input.value), parseFloat(y_scale_input.value)];
      obj.setScale(x, y);
    }
  });
}

function draw_line() {
  //Kode gambar line
  appState = AppState.Draw;
  drawingContext = ObjectType.Line
  sisa_vertex = 2;
}

function draw_square() {
  //Kode gambar square
  appState = AppState.Draw;
  drawingContext = ObjectType.Rect
  sisa_vertex = 2;
}

function draw_rectangle() {
  appState = AppState.Draw;
  drawingContext = ObjectType.Rect;
  sisa_vertex = 2;
}

function draw_polygon() {
  appState = AppState.Draw;
  drawingContext = ObjectType.Poly;
  sisa_vertex = 999;
}

function dragEvent(gl: WebGL2RenderingContext, event, objectList: GLObjectList, program_info: ProgramInfo) {
  if (isMouseDown) {
    const position = [event.pageX - event.target.offsetLeft, gl.drawingBufferHeight - (event.pageY - event.target.offsetTop)];
    const obj = objectList.getObject(lastSelectedObjId);
    if (!obj) return;
    if (lastSelectedVertId > 0 && mouseHoverVertId > 0) {
      if(obj.object_type == ObjectType.Rect || obj.object_type == ObjectType.Square){
        obj.moveVertexSegiEmpat(lastSelectedVertId - 1, position[0], position[1]);
      }else{
        obj.moveVertex(lastSelectedVertId - 1, position[0], position[1]);
      }
    } else {
      obj.setPosition(position[0], position[1]);
    }
  }else{
    appState === AppState.Select
  }
}

function drawScene(gl: WebGL2RenderingContext, program_info) {
  const shader_program = program_info.shader_program;
  gl.useProgram(shader_program);
  gl.bindBuffer(gl.ARRAY_BUFFER, program_info.buffers.position_buffer);
  const vertexPos = gl.getAttribLocation(shader_program, "attrib_vertexPos");
  const resolutionPos = gl.getUniformLocation(shader_program, "u_resolution");
  const uniformPos = gl.getUniformLocation(shader_program, "u_pos");
  const identityMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  gl.uniform2f(resolutionPos, gl.canvas.width, gl.canvas.height);
  gl.uniformMatrix3fv(uniformPos, false, identityMatrix);
  gl.vertexAttribPointer(vertexPos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPos);
  const uniformcCol = gl.getUniformLocation(shader_program, "u_fragColor");
  //setting color fragment saat gambar garisnya
  gl.uniform4f(uniformcCol, 0, 0.5, 1, 1);
  if (drawingContext === ObjectType.Poly) {
    //Menggambar garis setiap melewati vertex yang terbentuk
    gl.drawArrays(gl.LINE_STRIP, 0, vertex_array_buffer.length / 2 + 1);
  } else {
    gl.drawArrays(gl.LINES, 0, vertex_array_buffer.length / 2 + 1);
  }
}

function drawTexture(gl: WebGL2RenderingContext, program_info: ProgramInfo, objList: GLObjectList) {
  const { frame_buffer } = program_info.buffers;
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program_info.select_program);
  const resolutionPos = gl.getUniformLocation(program_info.select_program, "u_resolution");
  gl.uniform2f(resolutionPos, gl.canvas.width, gl.canvas.height);
  objList.renderTexture(program_info);
}

async function main() {
  const canvas = document.getElementById("content") as HTMLCanvasElement;
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext("webgl2");
  glReference = gl;
  if (!gl) {
    alert("WebGL is not supported on this browser/device");
    return;
  }

  program_info.shader_program = await initShaderFiles(gl, "draw_vertex.glsl", "draw_fragment.glsl");
  program_info.select_program = await initShaderFiles(gl, "select_vertex.glsl", "select_fragment.glsl");
  program_info.vertex_point_program = await initShaderFiles(gl, "point_vertex.glsl", "point_fragment.glsl");
  program_info.vertex_select_program = await initShaderFiles(gl, "point_vertex.glsl", "selectPoint_fragment.glsl");
  let objectList: GLObjectList = new GLObjectList(program_info.select_program);

  setupUI(objectList);

  canvas.addEventListener(
    "mousemove",
    (event) => {
      printMousePos(canvas, event, gl);
      dragEvent(gl, event, objectList, program_info);
    },
    false
  );
  canvas.addEventListener(
    "click",
    (event) => {
      clickEvent(gl, event, objectList, program_info);
    },
    false
  );
  canvas.addEventListener("mousedown", () => {
    isMouseDown = true;
    // if (appState === AppState.Move) {
      if (mouseHoverVertId > 0) lastSelectedVertId = mouseHoverVertId;
      document.getElementById("vertex-selected-id").innerText = lastSelectedVertId.toString();
    // }
  });
  canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });
  document.addEventListener("dblclick", (event) => {
    if (appState === AppState.Draw && drawingContext === ObjectType.Poly) {
      console.log("Double Click pressed");
      onDoubleClickEvent(gl, event, objectList, program_info);
    }
  });

  // render block
  var then = 0;
  init(gl, program_info, vertex_array_buffer);
  function render(now) {
    now *= 0.001;
    const deltatime = now - then;
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    drawTexture(gl, program_info, objectList);
    const pixelX = (mousePos[0] * gl.canvas.width) / canvas.clientWidth;
    const pixelY = gl.canvas.height - (mousePos[1] * gl.canvas.height) / canvas.clientHeight - 1;
    const data = new Uint8Array(4);
    gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    if (data[3] === 0xff && (data[2] != 0xff && data[1] != 0xff, data[0] != 0xff)) {
      const id = data[0] + (data[1] << 8) + (data[2] << 16);
      mouseHoverVertId = id;
    } else {
      mouseHoverVertId = -1;
    }
    if (data[3] === 0x00) {
      const id = data[0] + (data[1] << 8) + (data[2] << 16);
      mouseHoverObjId = id;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (appState === AppState.Draw) {
      recalcPosBuf(gl, program_info, vertex_array_buffer, mousePosVertNormalized);
      drawScene(gl, program_info);
    }
    objectList.render(program_info);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function clickEvent(gl: WebGL2RenderingContext, event, objectList: GLObjectList, program_info: ProgramInfo) {
  if (appState === AppState.Draw) {
    const position = [event.pageX - event.target.offsetLeft, gl.drawingBufferHeight - (event.pageY - event.target.offsetTop)];
    vertex_array_buffer.push(position[0]);
    vertex_array_buffer.push(position[1]);
    sisa_vertex = sisa_vertex - 1;
    if (sisa_vertex == 0) {
      appState = AppState.Select;
      if (drawingContext === ObjectType.Line) {
        //Line disini
        const glObj = new GLObject(gl.LINES, program_info.shader_program, gl, ObjectType.Line);
        glObj.assignVertexArray([...vertex_array_buffer]);
        glObj.assignId(totalObj + 1)
        glObj.bind()
        objectList.addObject(glObj);
        totalObj++
      } else if (drawingContext === ObjectType.Square) {
        //Square disini
        const glObj = new GLObject(gl.TRIANGLES, program_info.shader_program, gl, ObjectType.Square)
        const localVertexArray = [
          vertex_array_buffer[0], vertex_array_buffer[1],
          vertex_array_buffer[2], vertex_array_buffer[3],
          vertex_array_buffer[4], vertex_array_buffer[5],
          vertex_array_buffer[6], vertex_array_buffer[7]
        ]
        glObj.assignVertexArray(localVertexArray);
        glObj.assignId(totalObj + 1)
        glObj.bind()
        objectList.addObject(glObj);
        totalObj++
      } else if (drawingContext === ObjectType.Rect) {
        //Rect disini
        const glObj = new GLObject(gl.TRIANGLES, program_info.shader_program, gl, ObjectType.Rect);
        const deltaX = vertex_array_buffer[2] - vertex_array_buffer[0];
        const deltaY = vertex_array_buffer[3] - vertex_array_buffer[1];
        const localVab = [vertex_array_buffer[0], vertex_array_buffer[1], vertex_array_buffer[0], vertex_array_buffer[1] + deltaY, vertex_array_buffer[2], vertex_array_buffer[3], vertex_array_buffer[0] + deltaX, vertex_array_buffer[1]];
        glObj.assignVertexArray(localVab);
        glObj.assignId(totalObj + 1);
        glObj.bind();
        objectList.addObject(glObj);
        totalObj++;
      } else if (drawingContext === ObjectType.Poly) {
        const glObj = new GLObject(gl.TRIANGLES, program_info.shader_program, gl, ObjectType.Poly);
        glObj.assignVertexArray([...vertex_array_buffer]);
        glObj.assignId(totalObj + 1);
        glObj.bind();
        objectList.addObject(glObj);
        totalObj++;
        console.log("poly created");
      }
      vertex_array_buffer.length = 0;
    }
  } else if (appState === AppState.Select) {
    previouslySelectedObjId = lastSelectedObjId;
    lastSelectedObjId = mouseHoverObjId;
    if (lastSelectedObjId != 0 && lastSelectedObjId != previouslySelectedObjId) {
      objectList.getObject(previouslySelectedObjId)?.deselect();
      const obj = objectList.getObject(lastSelectedObjId);
      if (!obj) return;
      obj.setSelected(true);
      const [xPos, yPos] = obj.position;
      const [xScale, yScale] = [...obj.scale];
      const color = ConvertRGBtoHex(obj.color[0], obj.color[1], obj.color[2]);
      document.getElementById("selected-id").innerText = lastSelectedObjId.toString();
      document.getElementById("x-pos-val").innerText = xPos.toString();
      document.getElementById("y-pos-val").innerText = yPos.toString();
      (document.getElementById("x-pos-range") as HTMLInputElement).value = xPos.toString();
      (document.getElementById("y-pos-range") as HTMLInputElement).value = yPos.toString();
      (document.getElementById("x-scale-input") as HTMLInputElement).value = xScale.toString();
      (document.getElementById("y-scale-input") as HTMLInputElement).value = yScale.toString();
      (document.getElementById("color-pallete") as HTMLInputElement).value = color;
    } else if (lastSelectedObjId == previouslySelectedObjId){
      objectList.getObject(previouslySelectedObjId)?.deselect();
      previouslySelectedObjId = -1;
      lastSelectedObjId = -1;
      document.getElementById("selected-id").innerText = "none";
    }
    else {
      objectList.deselectAll();
      previouslySelectedObjId = -1;
      document.getElementById("selected-id").innerText = "none";
    }
  }
}

//Method untuk tombol enter ditekan
function onDoubleClickEvent(gl: WebGL2RenderingContext, event, objectList: GLObjectList, program_info: ProgramInfo) {
  if (appState === AppState.Draw){
    sisa_vertex = 0;
    appState = AppState.Select;
    const glObj = new GLObject(gl.TRIANGLES, program_info.shader_program, gl, ObjectType.Poly);
    glObj.assignVertexArray([...vertex_array_buffer]);
    glObj.assignId(totalObj + 1);
    glObj.bind();
    objectList.addObject(glObj);
    totalObj++;
    console.log("polygon berhasil dibuat");
    vertex_array_buffer.length = 0;
  }
}

function ColorToHex(color) {
  var hexadecimal = color.toString(16);
  return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
}

function ConvertRGBtoHex(red, green, blue) {
  return "#" + ColorToHex(red) + ColorToHex(green) + ColorToHex(blue);
}

function HexToColor(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function (m, r, g, b) {
      return r + r + g + g + b + b;
    })
  );

  if (result) {
    return {
      r: parseInt(result[1], 16) / 256,
      g: parseInt(result[2], 16) / 256,
      b: parseInt(result[3], 16) / 256,
    };
  }
  return null;
}

function printMousePos(canvas: HTMLCanvasElement, event, gl: WebGL2RenderingContext) {
  const position = [event.pageX - event.target.offsetLeft, gl.drawingBufferHeight - (event.pageY - event.target.offsetTop)];
  const { x, y } = getMousePosition(canvas, event);
  document.getElementById("x-pos").innerText = x.toString();
  document.getElementById("y-pos").innerText = y.toString();
  document.getElementById("object-id").innerText = mouseHoverObjId > 0 ? mouseHoverObjId.toString() : "none";
  document.getElementById("vertex-id").innerText = mouseHoverVertId != -1 ? mouseHoverVertId.toString() : "none";
  mousePos = [x, y];
  mousePosVertNormalized = [position[0], position[1]];
}

function getMousePosition(canvas: HTMLCanvasElement, event) {
  const bound = canvas.getBoundingClientRect();
  return {
    x: event.clientX - bound.left,
    y: event.clientY - bound.top,
  };
}

main();
