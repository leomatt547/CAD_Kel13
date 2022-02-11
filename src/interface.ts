export interface ProgramInfo {
  shader_program?: WebGLProgram;
  vertex_program?: WebGLProgram;
}

export interface Buffers {
  position_buffer?: any;
  color_buffer?: any;
  texture_buffer?: WebGLTexture;
  depth_buffer?: WebGLRenderbuffer;
  frame_buffer?: WebGLFramebuffer;
}

export enum ObjectType {
  Point,
  Line,
  Square,
  Rect,
  Poly,
}

export interface GLObjectData {
  position: [number, number];
  anchor_point: [number, number];
  rotation: number;
  scale: [number, number];
  color: [number, number, number, number];
  indices_length: number;
  vertex_array: Array<number>;
  type: number;
  object_type: number;
  name: String;
  id: number;
  projection_matrix: Array<number>;
}

export interface AppData {
  gl_object_data: GLObjectData[];
  created_at: Date;
}

export enum AppState {
  Draw,
  Select,
  Move,
  Rotate,
  Scale,
}
