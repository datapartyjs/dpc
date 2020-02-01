 
const debug = require('debug')('dpc.developer-add')
const CmdTree = require('command-tree')
const Project = require('../utils/dpc-project')

const uniqueArray = (arr)=>{
  return arr.filter((v, i, a) => {
    if( v !== undefined && a.indexOf(v) === i){
      return true
    }

    return false
  })
}

const DEFINITION = {
  h: {
    description: 'Show help',
    alias: 'help',
    type: 'help'
  },
  e: {
    alias: 'email',
    description: 'Developer email',
    require: true,
    multiple:true
  },
  k: {
    alias: 'keygrip',
    description: 'Developer PGP keygrip',
    require: false,
    multiple:true
  },
  d: {
    alias: 'discord',
    description: 'Developer discord',
    require: false,
    multiple:true
  },
  g: {
    alias: 'github',
    description: 'Developer github',
    require: false,
    multiple:true
  }
}

class DeveloperAdd extends CmdTree.Command {
  constructor(context){
    super({...DeveloperAdd.Definition, context})
    debug('constructor')
  }
  
  static get Command(){
    return 'developer add'
  }
  
  static get Definition(){
    return {
      usage: `dpc developer add [options]`,
      description: 'Add developer to project',
      definition: DEFINITION
    }
  }
  
  async run({parsed}){
    debug('context -', this.context)
    
    if (parsed.h) {
      throw new CmdTree.Error.HelpRequest('help request')
    }

    if (!parsed.email){
      throw new CmdTree.Error.UsageError('no name provided')
    }

    const bucket = await this.context.gpgfs.bucket('dpc')
    
    if(!await bucket.exists()){ await bucket.create() }
    
    const project = new Project(await bucket.file('dataparty.json'))
    
    await project.open()

    await project.setDeveloper({
      name: parsed.email[0],
      email: parsed.email,
      github: parsed.github,
      discord: parsed.discord,
      keygrip: parsed.keygrip
    })

    await project.save()
    
    return project.data
  }
}

module.exports = DeveloperAdd