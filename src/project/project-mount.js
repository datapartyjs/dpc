 
const Gpgfs = require('gpgfs')
const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.project-mount')

const Project = require('../utils/dpc-project')

const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  }
}

class ProjectMount extends CmdTree.Command {
  constructor(context){
    super({...ProjectMount.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'project mount'
  }
  
  static get Definition(){
    return {
      usage: `dpc project mount [options]`,
      description: 'Mount project secrets you have access',
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

    const fuse = new Gpgfs.FuseMount('gpgfs')
    await fuse.start()
  
    await fuse.addBucket(bucket)
    
    console.log('mounted')

    return
  }

  async format({format, output}){

    if(format == 'json' || format =='humanize'){ return JSON.stringify(output,null,2) }

  }
}

module.exports = ProjectMount
