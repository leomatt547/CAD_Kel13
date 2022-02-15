import GLObject from './GLObject'
import { GLObjectData, ObjectType, ProgramInfo } from '../interface'

class GLObjectList {
    public gl_object_list: GLObject[];
    public select_program: WebGLProgram;

    constructor(select_program?: WebGLProgram) {
        this.gl_object_list = new Array<GLObject>()
        if (select_program) this.select_program = select_program
    }

    addObject(obj: GLObject) {
        this.gl_object_list.push(obj)
    }
    
    render(program_info: ProgramInfo) {
        for (const obj of this.gl_object_list) {
            obj.draw()
            if (obj.is_selected) {
                obj.drawPoint(program_info.vertex_point_program)
            }
        }
    }

    renderTexture(program_info: ProgramInfo) {
        for (const obj of this.gl_object_list) {
            if (obj.is_selected) {
                obj.drawPointSelect(program_info.vertex_select_program)
                obj.drawSelect(program_info.select_program)
            } else {
                obj.drawSelect(program_info.select_program)
            }
        }
    }

    renderPoint(vertex_point_program: WebGLProgram) {
        for (const obj of this.gl_object_list) {
            obj.drawPoint(vertex_point_program)
        }
    }

    getObject(id: number) {
        return this.gl_object_list[id - 1]
    }

    getAllObjectData() {
        const objects: GLObjectData[] = []
        for (const obj of this.gl_object_list) {
            objects.push(obj.getData())
        }
        return objects
    }

    load(objectData: GLObjectData[], shader: WebGLProgram, gl: WebGL2RenderingContext) {
        for (const loadedObj of objectData) {
            const obj = new GLObject(gl.LINES, shader, gl, ObjectType.Line)
            obj.setData(loadedObj)
            this.gl_object_list.push(obj)
        }
    }

    deselectAll() {
        for (const obj of this.gl_object_list) {
            // obj.setSelected(false)
            obj.deselect()
        }
    }
}

export default GLObjectList