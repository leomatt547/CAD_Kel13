export function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    const nav = (window.navigator as any);
    if (nav.msSaveOrOpenBlob)
        nav.msSaveOrOpenBlob(file, filename);
    else {
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

export function recalcPosBuf(gl: WebGL2RenderingContext, programInfo, vertex_array_buffer: Array<number>, mousePos: number[]) {
    const intermediateBuf = [...vertex_array_buffer, mousePos[0], mousePos[1]]
    const position_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intermediateBuf), gl.STATIC_DRAW)
    gl.deleteBuffer(programInfo.buffers.position_buffer)
    programInfo.buffers.position_buffer = position_buffer
}