 
const debug = require('debug')
const CmdTree = require('command-tree')


const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  },
  n: {
    alias: 'name',
    description: 'Project Name',
    require: true
  }
  
}

class ProjectInit extends CmdTree.Command {
  constructor(context){
    super({...ProjectInit.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'project init'
  }
  
  static get Definition(){
    return {
      usage: `dpc project init [options]`,
      description: 'Initialize secure project',
      definition: DEFINITION
    }
  }
  
  async run({parsed}){
    debug('context -', this.context)
    
    if (parsed.h) {
      throw new CommandTree.HelpRequest('help request')
    }

    if (!parsed.name){
      throw new CommandTree.UsageError('no name provided')
    }

    const bucket = await this.gpgfs.bucket('dpc'+parsed.name)
    
    if(!await bucket.exists()){ await bucker.create() }
    
    const datapartyFile = await bucket.file('dataparty.json')
    
    if(!await datapartyFile.exists()){
      
    }
    
    return null
  }
}

module.exports = ProjectInit
