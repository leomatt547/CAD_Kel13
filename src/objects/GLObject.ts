import { multiplyMatrix } from "../utils/matrix";
import { GLObjectData } from "../interface";

class GLObject {
  public position: [number, number] = [0, 0];
  public anchor_point: [number, number];
  public scale: [number, number];
  public color: [number, number, number, number];
  public shader: WebGLProgram;
  public gl: WebGL2RenderingContext;
  public vertex_array: Array<number>;
  public indices_length: number;
  public vertex_array_buffer: WebGLBuffer;
  public type: number;
  public object_type: number;
  public name: string;
  public id: number;
  public is_selected: boolean = false;
  public projection_matrix: Array<number>;

  constructor(
    type: number,
    shader: WebGLProgram,
    gl: WebGL2RenderingContext,
    object_type: number,
    position?: [number, number],
    color?: [number, number, number, number]
  ) {
    this.shader = shader;
    this.gl = gl;
    this.type = type;
    this.object_type = object_type;
    this.color = [0.5, 0.5, 0.5, 1.0];
  }

  getData(): GLObjectData {
    const gl_object: GLObjectData = {
      position: this.position,
      anchor_point: this.anchor_point,
      scale: this.scale,
      color: this.color,
      indices_length: this.indices_length,
      vertex_array: this.vertex_array,
      type: this.type,
      object_type: this.object_type,
      id: this.id,
      projection_matrix: this.projection_matrix,
    };
    return gl_object;
  }

  setData(gl_object: GLObjectData) {
    this.position = gl_object.position;
    this.anchor_point = gl_object.anchor_point;
    this.scale = gl_object.scale;
    this.color = gl_object.color;
    this.vertex_array = gl_object.vertex_array;
    this.indices_length = gl_object.indices_length;
    this.type = gl_object.type;
    this.object_type = gl_object.object_type;
    this.id = gl_object.id;
    this.projection_matrix = gl_object.projection_matrix;
  }
  
  //assign
  assignId(id: number) { 
    this.id = id 
  }
  
  // methods
  assignVertexArray(vertex_array: Array<number>) {
    this.vertex_array = vertex_array
    this.setAnchorPoint()
    const [centerX, centerY] = this.anchor_point
    const transformedVertexArray = [...this.vertex_array]
    for (let i = 0; i < transformedVertexArray.length; i += 2) {
      transformedVertexArray[i] -= centerX
      transformedVertexArray[i+1] -= centerY
    }
    this.vertex_array = transformedVertexArray
    this.position = this.anchor_point
    this.scale = this.scale || [1,1]
    this.projection_matrix = this.calcProjectionMatrix()
  }

  setAnchorPoint() {
    if (this.vertex_array && this.vertex_array.length % 2 === 0) {
      let sigmaX = 0
      let sigmaY = 0
      for (let i = 0; i < this.vertex_array.length; i += 2) {
        sigmaX += this.vertex_array[i]
        sigmaY += this.vertex_array[i+1]
      }
      this.anchor_point = [sigmaX / (this.vertex_array.length/2), sigmaY / (this.vertex_array.length/2)]
    }
  }

  setVertexArray(vertex_array: number[]) {
    this.vertex_array = vertex_array;
  }

  moveVertex(index: number, x: number, y: number) {
    this.vertex_array[index*2] = x - this.position[0]
    this.vertex_array[index*2+1] = y - this.position[1]
    this.setAnchorPoint()
    const [centerX, centerY] = this.anchor_point
    const transformedVertexArray = [...this.vertex_array]
    for (let i = 0; i < transformedVertexArray.length; i += 2) {
        transformedVertexArray[i] -= centerX
        transformedVertexArray[i+1] -= centerY
    }
    this.vertex_array = transformedVertexArray
    this.position[0] += this.anchor_point[0]
    this.position[1] += this.anchor_point[1]
    this.projection_matrix = this.calcProjectionMatrix()
  }

  indexswitcher(index: number, num_elements: number){
    if(index >= num_elements){
      return 0
    }else if(index < 0){
      return num_elements + index
    }else{
      return index
    }
  }
  moveVertexSegiEmpat(index: number, x: number, y: number) {
    //edit vertex yg digeser
    this.vertex_array[index*2] = x - this.position[0]
    this.vertex_array[index*2+1] = y - this.position[1]
    if(index == 1 || index == 3){
      //edit vertex sebelumnya
      this.vertex_array[(this.indexswitcher(index-1, 4))*2] = x - this.position[0]
      //this.vertex_array[(this.indexswitcher(index-1, 4))*2+1] = y - this.position[1]
      //edit vertex setelahnya
      //this.vertex_array[(this.indexswitcher(index+1, 4))*2] = x - this.position[0]
      this.vertex_array[(this.indexswitcher(index+1, 4))*2+1] = y - this.position[1]
    }else{
      //edit vertex sebelumnya
      //this.vertex_array[(this.indexswitcher(index-1, 4))*2] = x - this.position[0]
      this.vertex_array[(this.indexswitcher(index-1, 4))*2+1] = y - this.position[1]
      //edit vertex setelahnya
      this.vertex_array[(this.indexswitcher(index+1, 4))*2] = x - this.position[0]
      //this.vertex_array[(this.indexswitcher(index+1, 4))*2+1] = y - this.position[1]
    }
    this.setAnchorPoint()
    const [centerX, centerY] = this.anchor_point
    const transformedVertexArray = [...this.vertex_array]
    for (let i = 0; i < transformedVertexArray.length; i += 2) {
        transformedVertexArray[i] -= centerX
        transformedVertexArray[i+1] -= centerY
    }
    this.vertex_array = transformedVertexArray
    this.position[0] += this.anchor_point[0]
    this.position[1] += this.anchor_point[1]
    this.projection_matrix = this.calcProjectionMatrix()
  }

  setPosition(_x: number, _y: number) {
    this.position = [_x, _y];
    this.projection_matrix = this.calcProjectionMatrix();
  }

  setScale(_x: number, _y: number) {
    this.scale = [_x, _y];
    this.projection_matrix = this.calcProjectionMatrix();
  }

  setColor(color: [number, number, number, number]) {
    this.color = color 
  }

  setSelected(is_selected: boolean) {
    this.is_selected = is_selected
  }
  
  deselect() {
    this.is_selected = false
  }

  calcProjectionMatrix() {
    if (
      this.position === undefined ||
      this.scale === undefined
    )
      return null;
    const [u, v] = this.position;
    const matrix_translasi = [1, 0, 0, 0, 1, 0, u, v, 1];
    const [k1, k2] = this.scale;
    const matrix_scale = [k1, 0, 0, 0, k2, 0, 0, 0, 1];
    const projectionMat = multiplyMatrix(
      matrix_scale,matrix_translasi
    );
    return projectionMat;
  }
  
  bind() {
    const gl = this.gl
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex_array), gl.STATIC_DRAW)
    this.vertex_array_buffer = buf
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    const indices = []
    if (this.type != gl.LINES) {
        for (let i = 2; i < this.vertex_array.length/2; i++) {
            indices.push(i-1)
            indices.push(i)
            indices.push(0)
        }
    } else {
        indices.push(0)
        indices.push(1)
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    this.indices_length = indices.length

  }

  draw(withProgram?: WebGLProgram) {
    this.bind()
    const program = withProgram || this.shader
    const gl = this.gl
    gl.useProgram(program)
    const vertexPos = gl.getAttribLocation(program, 'attrib_vertexPos')
    const uniformCol = gl.getUniformLocation(program, 'u_fragColor')
    const uniformPos = gl.getUniformLocation(program, 'u_pos')
    gl.uniformMatrix3fv(uniformPos, false, this.projection_matrix)
    gl.vertexAttribPointer(
        vertexPos,
        2, // it's 2 dimensional    
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.enableVertexAttribArray(vertexPos)
    if (this.color) {
      gl.uniform4fv(uniformCol, this.color)
    }
    gl.drawElements(this.type, this.indices_length, gl.UNSIGNED_SHORT, 0)
  }

  drawSelect(selectProgram: WebGLProgram) {
    this.bind()
    const gl = this.gl
    const id = this.id
    gl.useProgram(selectProgram)
    const vertexPos = gl.getAttribLocation(selectProgram, 'a_Pos')
    const uniformCol = gl.getUniformLocation(selectProgram, 'u_id')
    const uniformPos = gl.getUniformLocation(selectProgram, 'u_pos')
    gl.uniformMatrix3fv(uniformPos, false, this.projection_matrix)
    gl.vertexAttribPointer(
        vertexPos,
        2, // it's 2 dimensional
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.enableVertexAttribArray(vertexPos)
    const uniformId = [
        ((id >> 0) & 0xFF) / 0xFF,
        ((id >> 8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF,
    ]
    gl.uniform4fv(uniformCol, uniformId)
    gl.drawElements(this.type, this.indices_length, gl.UNSIGNED_SHORT, 0)
  }

  drawPoint(vertex_point_program: WebGLProgram) {
    this.bind()
    const program = vertex_point_program
    const gl = this.gl
    gl.useProgram(program)
    const vertexPos = gl.getAttribLocation(program, 'a_Pos')
    const uniformCol = gl.getUniformLocation(program, 'u_fragColor')
    const uniformPos = gl.getUniformLocation(program, 'u_pos')
    const resolutionPos = gl.getUniformLocation(program, 'u_resolution')
    gl.uniformMatrix3fv(uniformPos, false, this.projection_matrix)
    gl.vertexAttribPointer(
        vertexPos,
        2, // it's 2 dimensional
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.uniform2f(resolutionPos, gl.canvas.width, gl.canvas.height)
    gl.enableVertexAttribArray(vertexPos)
    if (this.color) {
        gl.uniform4fv(uniformCol, this.color)
    }
    gl.uniform4fv(uniformCol, [0.0, 0.0, 1.0, 1.0])
    if (this.indices_length > 3) {
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 2)
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 4)
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 0)
        for (let i = 3; i < this.indices_length; i+=3) {
            gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, (i+1)*2)
        }
    } else {
        gl.drawElements(gl.POINTS, 2, gl.UNSIGNED_SHORT, 0)
    }
  }

  drawPointSelect(selectProgram: WebGLProgram) {
    this.bind()
    const gl = this.gl
    gl.useProgram(selectProgram)
    const vertexPos = gl.getAttribLocation(selectProgram, 'a_Pos')
    const uniformCol = gl.getUniformLocation(selectProgram, 'u_id')
    const uniformPos = gl.getUniformLocation(selectProgram, 'u_pos')
    const resolutionPos = gl.getUniformLocation(selectProgram, 'u_resolution')
    gl.uniformMatrix3fv(uniformPos, false, this.projection_matrix)
    gl.vertexAttribPointer(
        vertexPos,
        2, // it's 2 dimensional
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.enableVertexAttribArray(vertexPos)
    gl.uniform2f(resolutionPos, gl.canvas.width, gl.canvas.height)
    if (this.indices_length > 3) {
        gl.uniform4fv(uniformCol, setElementId(2))
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 0)
        gl.uniform4fv(uniformCol, setElementId(3))
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 2)
        gl.uniform4fv(uniformCol, setElementId(1))
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 4)
        let lastVertId = 4
        for (let i = 3; i < this.indices_length; i+=3) {
            gl.uniform4fv(uniformCol, setElementId(lastVertId))
            gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, (i+1)*2)
            lastVertId++
        }
    } else {
        gl.uniform4fv(uniformCol, setElementId(1))
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 0)
        gl.uniform4fv(uniformCol, setElementId(2))
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, 2)
    }        
  }
}

function setElementId(id: number) {
  const uniformId = [
      ((id >> 0) & 0xFF) / 0xFF,
      ((id >> 8) & 0xFF) / 0xFF,
      ((id >> 16) & 0xFF) / 0xFF,
      0x69,
  ]
  return uniformId
}

export default GLObject;
