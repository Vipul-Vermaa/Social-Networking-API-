import DataUriParser from 'datauri/parser.js'
import path from 'path'

const getDataUri=(file)=>{
    const paresr=new DataUriParser()
    const extName=path.extname(file.originalName).toString()
    return paresr.format(extName,file.buffer)
}

export default getDataUri