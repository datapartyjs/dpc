 

const CmdTree = require('command-tree')
const Hoek = require('@hapi/hoek')
const debug = require('debug')('dpc.project-init')

const Project = require('../utils/dpc-project')

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
      throw new CmdTree.Error.HelpRequest('help request')
    }

    if (!parsed.name){
      throw new CmdTree.Error.UsageError('no name provided')
    }

    const bucket = await this.context.gpgfs.bucket('dpc')
    
    if(!await bucket.exists()){ await bucket.create() }
    
    const project = new Project(await bucket.file('dataparty.json'))
    
    project.name = parsed.name
    project.owners = await this.context.gpgfs.keychain.whoami()
    
    const secretKeys = await this.context.gpgfs.keychain.listSecretKeys()
    const developer = {
      name: project.owners[0],
      email: project.owners,
      keygrip: [Hoek.reach(secretKeys, '0.fpr.0.user_id')]
    }

    project.setByName('developers', developer)

    await project.init()
    
    return project.data
  }
}

module.exports = ProjectInit
