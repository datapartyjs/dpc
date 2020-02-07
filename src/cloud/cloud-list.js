 

const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.cloud-list')

const Project = require('../utils/dpc-project')

const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  }
}

class CloudList extends CmdTree.Command {
  constructor(context){
    super({...CloudList.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'cloud list'
  }
  
  static get Definition(){
    return {
      usage: `dpc cloud list [options]`,
      description: 'List clouds you have access to',
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
    
    await this.context.gpgfs.cacheWhoami()
    const whoami = this.context.gpgfs.whoami

    debug('whoami', whoami)

    return project.getUserClouds(whoami)
  }

  async format({format, output}){

    if(format == 'json' || format =='humanize'){ return JSON.stringify(output,null,2) }

  }
}

module.exports = CloudList
