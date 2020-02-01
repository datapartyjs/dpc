 

const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.project-show')

const Project = require('../utils/dpc-project')

const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  }
}

class ProjectShow extends CmdTree.Command {
  constructor(context){
    super({...ProjectShow.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'project show'
  }
  
  static get Definition(){
    return {
      usage: `dpc project show [options]`,
      description: 'Show project definition',
      definition: DEFINITION
    }
  }
  
  async run({parsed}){
    debug('context -', this.context)
    
    if (parsed.h) {
      throw new CmdTree.Error.HelpRequest('help request')
    }


    const bucket = await this.context.gpgfs.bucket('dpc')
    
    if(!await bucket.exists()){ await bucket.create() }
    
    const project = new Project(await bucket.file('dataparty.json'))
    await project.open()
    
    return project.data
  }

  async format({format, output}){

    if(format == 'json' || format =='humanize'){ return JSON.stringify(output,null,2) }
  }
}

module.exports = ProjectShow
