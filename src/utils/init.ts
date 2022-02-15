import {loadShader} from '../loader'
import {ProgramInfo} from '../interface'

export async function initShader(gl: WebGL2RenderingContext) {
    const vs = await loadShader(gl, gl.VERTEX_SHADER, 'x-shader/x-vertex')
    const fs = await loadShader(gl, gl.FRAGMENT_SHADER, 'x-shader/x-fragment')
    const shader_program = gl.createProgram()
    gl.attachShader(shader_program, vs)
    gl.attachShader(shader_program, fs)
    gl.linkProgram(shader_program)
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        alert('Maaf, ada masalah saat inisiasi program shader: ' + gl.getProgramInfoLog(shader_program))
        return null
    }
    return shader_program
}

export async function initShaderFiles(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
    const vs = await loadShader(gl, gl.VERTEX_SHADER, vertex)
    const fs = await loadShader(gl, gl.FRAGMENT_SHADER, fragment)
    const shader_program = gl.createProgram()
    gl.attachShader(shader_program, vs)
    gl.attachShader(shader_program, fs)
    gl.linkProgram(shader_program)
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        alert('Maaf, ada masalah saat inisiasi program shader: ' + gl.getProgramInfoLog(shader_program))
        return null
    }
    return shader_program
}

export function init(gl: WebGL2RenderingContext, program_info: ProgramInfo, vertex_array_buffer: Array<number>) {
    const position_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_array_buffer), gl.STATIC_DRAW)
    program_info.buffers = {
        position_buffer: position_buffer
    }

    // texture and render buffers for picking
    const texture_buffer = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture_buffer)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // depth buffer
    const depth_buffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth_buffer)
    function setFrameBufferAttatchmentSizes(width: number, height: number) {
        gl.bindTexture(gl.TEXTURE_2D, texture_buffer)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth_buffer)
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    }
    setFrameBufferAttatchmentSizes(gl.canvas.width, gl.canvas.height)

    // frame buffer
    const frame_buffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer)

    const attachment_point = gl.COLOR_ATTACHMENT0
    const level = 0
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment_point, gl.TEXTURE_2D, texture_buffer, level)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_buffer)

    program_info.buffers.texture_buffer = texture_buffer
    program_info.buffers.depth_buffer = depth_buffer
    program_info.buffers.frame_buffer = frame_buffer

}