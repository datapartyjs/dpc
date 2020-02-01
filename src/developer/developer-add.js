 
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
  
    const oldDeveloper = project.getByName('developers', {
      name: parsed.email[0]
    }) || {}

    debug('oldDeveloper', oldDeveloper)

    const developer = {
      name: parsed.email[0],
      email: uniqueArray([].concat(parsed.email, oldDeveloper.email)),
      github: uniqueArray([].concat(parsed.github, oldDeveloper.github)),
      discord: uniqueArray([].concat(parsed.discord, oldDeveloper.discord)),
      keygrip: uniqueArray([].concat(parsed.keygrip, oldDeveloper.keygrip)),
    }

    project.setByName('developers', developer)

    await project.save()
    
    return project.data
  }
}

module.exports = DeveloperAdd