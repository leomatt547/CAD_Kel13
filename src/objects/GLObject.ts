import { multiplyMatrix } from "../utils/matrix";
import { GLObjectData } from "../interface";

class GLObject {
  public position: [number, number] = [0, 0];
  public anchor_point: [number, number];
  public rotation: number;
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
      rotation: this.rotation,
      scale: this.scale,
      color: this.color,
      indices_length: this.indices_length,
      vertex_array: this.vertex_array,
      type: this.type,
      object_type: this.object_type,
      name: this.name,
      id: this.id,
      projection_matrix: this.projection_matrix,
    };
    return gl_object;
  }

  setData(gl_object: GLObjectData) {
    this.position = gl_object.position;
    this.anchor_point = gl_object.anchor_point;
    this.rotation = gl_object.rotation;
    this.scale = gl_object.scale;
    this.color = gl_object.color;
    this.vertex_array = gl_object.vertex_array;
    this.indices_length = gl_object.indices_length;
    this.type = gl_object.type;
    this.object_type = gl_object.object_type;
    this.id = gl_object.id;
    this.projection_matrix = gl_object.projection_matrix;
  }

  // methods
  setVertexArray(vertex_array: number[]) {
    this.vertex_array = vertex_array;
  }

  setPosition(_x: number, _y: number) {
    this.position = [_x, _y];
    this.projection_matrix = this.calcProjectionMatrix();
  }

  setRotation(_rotation: number) {
    this.rotation = _rotation;
    this.projection_matrix = this.calcProjectionMatrix();
  }

  setScale(_x: number, _y: number) {
    this.scale = [_x, _y];
    this.projection_matrix = this.calcProjectionMatrix();
  }

  calcProjectionMatrix() {
    if (
      this.position === undefined ||
      this.rotation === undefined ||
      this.scale === undefined
    )
      return null;
    const [u, v] = this.position;
    const matrix_translasi = [1, 0, 0, 0, 1, 0, u, v, 1];
    const degrees = this.rotation;
    const rad = (degrees * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const matrix_rotasi = [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
    const [k1, k2] = this.scale;
    const matrix_scale = [k1, 0, 0, 0, k2, 0, 0, 0, 1];
    const projectionMat = multiplyMatrix(
      multiplyMatrix(matrix_rotasi, matrix_scale),
      matrix_translasi
    );
    return projectionMat;
  }
  bind() {
    const gl = this.gl;
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertex_array),
      gl.STATIC_DRAW
    );
  }

  draw() {
    const gl = this.gl;
    gl.useProgram(this.shader);
    var vertexPos = gl.getAttribLocation(this.shader, "a_pos");
    var uniformCol = gl.getUniformLocation(this.shader, "u_fragColor");
    var uniformPos = gl.getUniformLocation(this.shader, "u_proj_mat");
    gl.vertexAttribPointer(vertexPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix3fv(uniformPos, false, this.projection_matrix);
    gl.uniform4fv(uniformCol, [1.0, 0.0, 0.0, 1.0]);
    gl.enableVertexAttribArray(vertexPos);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertex_array.length / 2);
  }
}

export default GLObject;
